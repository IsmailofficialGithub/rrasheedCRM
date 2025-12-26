"use client"

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { z } from 'zod'
import { Upload, AlertCircle, CheckCircle2, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Define the schema for validation
// Relaxed validation to handle multiple emails/phones or non-standard formats provided in the CSV/Excel
const leadSchema = z.object({
    company_name: z.string().min(1, "Company Name is required"),
    job_posting_url: z.string().optional().or(z.literal("")),
    city_state: z.string().optional(),
    salary_range: z.string().optional(),
    decision_maker_name: z.string().optional(),
    email: z.string().optional(), // Removed strict email validation to allow lists/formats
    phone_number: z.string().optional(),
})

type CSVRow = z.infer<typeof leadSchema>
type ValidationResult = {
    row: any
    isValid: boolean
    errors: Record<string, string>
}

export function CsvImporter({ onImportComplete }: { onImportComplete?: () => void }) {
    const [file, setFile] = useState<File | null>(null)
    const [parsedData, setParsedData] = useState<ValidationResult[]>([])
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const selectedFile = acceptedFiles[0]
        setFile(selectedFile)
        setError(null)
        setSuccessMessage(null)

        if (selectedFile) {
            if (selectedFile.name.endsWith('.csv')) {
                parseCSV(selectedFile)
            } else if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
                parseExcel(selectedFile)
            } else {
                setError("Unsupported file format. Please upload a CSV or Excel file.")
            }
        }
    }, [])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/csv': ['.csv'],
            'application/vnd.ms-excel': ['.csv'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel.sheet.macroEnabled.12': ['.xlsm'],
        },
        multiple: false
    })

    const [headers, setHeaders] = useState<string[]>([])
    const [debugRow, setDebugRow] = useState<any>(null)

    // Helper to safely convert any value to string or undefined
    const safeString = (val: any): string | undefined => {
        if (val === null || val === undefined) return undefined;
        const str = String(val).trim();
        return str === '' ? undefined : str;
    }

    const processData = (data: any[]) => {
        if (data.length > 0) {
            setHeaders(Object.keys(data[0]))
            setDebugRow(data[0]) // Capture the first row for debugging
        }

        const validatedRows = data.map((row: any) => {
            // Normalize keys to lowercase and trim spaces for safer matching
            const normalizedRow: any = {};
            Object.keys(row).forEach(key => {
                normalizedRow[key.toLowerCase().trim()] = row[key];
            });

            // Find keys that might contain "email" if exact match fails
            const emailKey = Object.keys(normalizedRow).find(k => k.includes('email') || k.includes('e-mail'));
            const phoneKey = Object.keys(normalizedRow).find(k => k.includes('phone') || k.includes('contact number'));

            // Map headers to Schema keys
            const mappedRow = {
                company_name: safeString(normalizedRow['company name'] || normalizedRow['company_name'] || normalizedRow['company']),
                job_posting_url: safeString(normalizedRow['job posting url'] || normalizedRow['job_posting_url'] || normalizedRow['url'] || normalizedRow['link']),
                city_state: safeString(normalizedRow['city+state'] || normalizedRow['city_state'] || normalizedRow['location'] || normalizedRow['city'] || normalizedRow['address']),
                salary_range: safeString(normalizedRow['salary range'] || normalizedRow['salary_range'] || normalizedRow['salary']),
                decision_maker_name: safeString(normalizedRow['decision maker name'] || normalizedRow['decision_maker_name'] || normalizedRow['decision maker'] || normalizedRow['name']),
                // Try exact matches first, then fallbacks, then fuzzy search
                email: safeString(
                    normalizedRow['email'] ||
                    normalizedRow['email address'] ||
                    normalizedRow['contact email'] ||
                    normalizedRow['decision maker email'] ||
                    (emailKey ? normalizedRow[emailKey] : undefined)
                ),
                phone_number: safeString(
                    normalizedRow['phone number'] ||
                    normalizedRow['phone_number'] ||
                    normalizedRow['phone'] ||
                    (phoneKey ? normalizedRow[phoneKey] : undefined)
                )
            }

            const result = leadSchema.safeParse(mappedRow)

            let errors: Record<string, string> = {}
            if (!result.success) {
                result.error.issues.forEach(issue => {
                    const path = issue.path[0] as string
                    errors[path] = issue.message
                })
            }

            return {
                row: mappedRow,
                isValid: result.success,
                errors
            }
        })
        setParsedData(validatedRows)
    }

    const parseCSV = (file: File) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                processData(results.data)
            },
            error: (error) => {
                setError(`Error parsing CSV: ${error.message}`)
            }
        })
    }

    const parseExcel = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                processData(jsonData);
            } catch (err) {
                setError("Error parsing Excel file. Please check the file format.")
                console.error(err)
            }
        };
        reader.readAsArrayBuffer(file);
    }

    const uploadData = async () => {
        const validRows = parsedData.filter(d => d.isValid).map(d => d.row)

        if (validRows.length === 0) {
            setError("No valid data to import.")
            return
        }

        setIsUploading(true)
        setUploadProgress(0)

        const supabase = createClient()

        // Batch insert
        const BATCH_SIZE = 50
        const totalBatches = Math.ceil(validRows.length / BATCH_SIZE)

        let successCount = 0
        let failCount = 0

        for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
            const batch = validRows.slice(i, i + BATCH_SIZE)

            const { error: insertError } = await supabase
                .from('leads')
                .insert(batch)

            if (insertError) {
                console.error("Batch insert error:", insertError)
                failCount += batch.length
            } else {
                successCount += batch.length
            }

            setUploadProgress(Math.round(((i + BATCH_SIZE) / validRows.length) * 100))
        }

        setIsUploading(false)
        setSuccessMessage(`Successfully imported ${successCount} leads. ${failCount > 0 ? `Failed to import ${failCount} rows.` : ''}`)
        setFile(null)
        setParsedData([])
        if (onImportComplete) onImportComplete()
    }

    const validCount = parsedData.filter(d => d.isValid).length
    const invalidCount = parsedData.filter(d => !d.isValid).length

    return (
        <Card>
            <CardHeader>
                <CardTitle>Import Leads from CSV</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {!file ? (
                    <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/25 hover:border-primary'
                            }`}
                    >
                        <input {...getInputProps()} />
                        <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                        <p className="text-lg font-medium">Drag & drop your CSV file here</p>
                        <p className="text-sm text-muted-foreground mt-2">
                            Expected headers: company name, job posting url, city+state, salary range, decision maker name, email, phone number
                        </p>
                        <Button variant="outline" className="mt-4">Select File</Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between bg-muted/50 p-4 rounded-md">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded bg-primary/20 flex items-center justify-center text-primary font-bold">
                                    CSV
                                </div>
                                <div>
                                    <p className="font-medium">{file.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {validCount} valid rows, {invalidCount} invalid rows
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Detected Headers: {headers.join(', ')}
                                    </p>
                                    {debugRow && (
                                        <div className="mt-2 p-2 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                                            First Row Raw Data:
                                            {JSON.stringify(debugRow, null, 2)}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => { setFile(null); setParsedData([]); }}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {successMessage && (
                            <Alert className="border-green-500 text-green-600 bg-green-50">
                                <CheckCircle2 className="h-4 w-4 stroke-green-600" />
                                <AlertTitle>Success</AlertTitle>
                                <AlertDescription>{successMessage}</AlertDescription>
                            </Alert>
                        )}

                        {parsedData.length > 0 && (
                            <div className="border rounded-md overflow-hidden max-h-[400px] overflow-y-auto overflow-x-auto relative">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-background z-10">
                                        <TableRow>
                                            <TableHead className="w-[50px]">Status</TableHead>
                                            <TableHead className="min-w-[150px]">Company</TableHead>
                                            <TableHead className="min-w-[150px]">Job URL</TableHead>
                                            <TableHead className="min-w-[120px]">Location</TableHead>
                                            <TableHead className="min-w-[120px]">Salary</TableHead>
                                            <TableHead className="min-w-[150px]">Decision Maker</TableHead>
                                            <TableHead className="min-w-[200px]">Email</TableHead>
                                            <TableHead className="min-w-[120px]">Phone</TableHead>
                                            <TableHead className="min-w-[200px]">Error</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {parsedData.map((result, index) => (
                                            <TableRow key={index} className={!result.isValid ? "bg-red-50 dark:bg-red-950/20" : ""}>
                                                <TableCell>
                                                    {result.isValid ? (
                                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                    ) : (
                                                        <AlertCircle className="h-4 w-4 text-red-500" />
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-medium whitespace-nowrap">{result.row.company_name || <span className="text-muted-foreground italic">Missing</span>}</TableCell>
                                                <TableCell className="max-w-[200px] truncate" title={result.row.job_posting_url}>{result.row.job_posting_url}</TableCell>
                                                <TableCell className="whitespace-nowrap">{result.row.city_state}</TableCell>
                                                <TableCell className="whitespace-nowrap">{result.row.salary_range}</TableCell>
                                                <TableCell className="whitespace-nowrap">{result.row.decision_maker_name}</TableCell>
                                                <TableCell className="max-w-[200px] truncate" title={result.row.email}>{result.row.email}</TableCell>
                                                <TableCell className="whitespace-nowrap">{result.row.phone_number}</TableCell>
                                                <TableCell className="text-red-500 text-xs">
                                                    {Object.values(result.errors).join(", ")}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        <div className="flex gap-4">
                            <Button
                                onClick={uploadData}
                                disabled={validCount === 0 || isUploading}
                                className="w-full"
                            >
                                {isUploading ? `Uploading... ${uploadProgress}%` : `Import ${validCount} Valid Leads`}
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
