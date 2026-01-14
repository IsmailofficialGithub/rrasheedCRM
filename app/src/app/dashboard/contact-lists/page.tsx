"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, Download, Loader2, Users, FileText, AlertCircle, CheckCircle2, X, PhoneCall } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { useDropzone } from "react-dropzone"
import Papa from "papaparse"
import * as XLSX from "xlsx"
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"
import { startCallingContacts } from "./actions"
import { format } from "date-fns"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

interface ContactList {
    id: string
    name: string
    file_name: string
    total_contacts: number
    created_at: string
    status: string
}

interface ContactRow {
    name: string
    phone: string
    email?: string
    [key: string]: any
}

export default function ContactListsPage() {
    const [file, setFile] = useState<File | null>(null)
    const [contactLists, setContactLists] = useState<ContactList[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isUploading, setIsUploading] = useState(false)
    const [isCalling, setIsCalling] = useState(false)
    const [parsedContacts, setParsedContacts] = useState<ContactRow[]>([])
    const [selectedContacts, setSelectedContacts] = useState<Set<number>>(new Set())
    const [listName, setListName] = useState("")
    const [selectedListId, setSelectedListId] = useState<string | null>(null)
    const selectAllCheckboxRef = useRef<HTMLButtonElement>(null)

    const supabase = createClient()

    const fetchContactLists = useCallback(async () => {
        setIsLoading(true)
        try {
            const { data, error } = await supabase
                .from('contact_lists')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error

            if (data) {
                setContactLists(data as ContactList[])
            }
        } catch (err: any) {
            console.error("Error fetching contact lists:", err)
            toast.error("Failed to fetch contact lists")
        } finally {
            setIsLoading(false)
        }
    }, [supabase])

    useEffect(() => {
        fetchContactLists()
    }, [fetchContactLists])

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const selectedFile = acceptedFiles[0]
        setFile(selectedFile)
        setParsedContacts([])
        setSelectedContacts(new Set())
        setListName(selectedFile.name.replace(/\.[^/.]+$/, ""))

        if (selectedFile) {
            if (selectedFile.name.endsWith('.csv')) {
                parseCSV(selectedFile)
            } else if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
                parseExcel(selectedFile)
            } else {
                toast.error("Unsupported file format. Please upload a CSV or Excel file.")
            }
        }
    }, [])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/csv': ['.csv'],
            'application/vnd.ms-excel': ['.csv'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel.sheet.macroEnabled.12': ['.xls'],
        },
        multiple: false
    })

    const parseCSV = (file: File) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                processContacts(results.data)
            },
            error: (error) => {
                toast.error(`Error parsing CSV: ${error.message}`)
            }
        })
    }

    const parseExcel = (file: File) => {
        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const data = e.target?.result
                const workbook = XLSX.read(data, { type: 'array' })
                const firstSheetName = workbook.SheetNames[0]
                const worksheet = workbook.Sheets[firstSheetName]
                const jsonData = XLSX.utils.sheet_to_json(worksheet)
                processContacts(jsonData)
            } catch (err) {
                toast.error("Error parsing Excel file. Please check the file format.")
                console.error(err)
            }
        }
        reader.readAsArrayBuffer(file)
    }

    const processContacts = (data: any[]) => {
        const contacts: ContactRow[] = data.map((row: any) => {
            // Normalize column names (case-insensitive, handle variations)
            const normalizedRow: any = {}
            Object.keys(row).forEach(key => {
                const lowerKey = key.toLowerCase().trim()
                if (lowerKey === 'name' || lowerKey === 'full name' || lowerKey === 'contact name') {
                    normalizedRow.name = String(row[key] || '').trim()
                } else if (lowerKey === 'phone' || lowerKey === 'number' || lowerKey === 'mobile' || lowerKey === 'phone number') {
                    normalizedRow.phone = String(row[key] || '').trim()
                } else if (lowerKey === 'email' || lowerKey === 'e-mail') {
                    normalizedRow.email = String(row[key] || '').trim()
                } else {
                    normalizedRow[key] = row[key]
                }
            })

            return normalizedRow
        }).filter((contact: ContactRow) => contact.name && contact.phone)

        setParsedContacts(contacts)
        // Select all contacts by default
        setSelectedContacts(new Set(contacts.map((_, index) => index)))
        if (contacts.length === 0) {
            toast.warning("No valid contacts found. Required columns: name, phone (or number/mobile)")
        } else {
            toast.success(`Parsed ${contacts.length} contacts from file`)
        }
    }

    const toggleSelectContact = (index: number) => {
        setSelectedContacts(prev => {
            const newSet = new Set(prev)
            if (newSet.has(index)) {
                newSet.delete(index)
            } else {
                newSet.add(index)
            }
            return newSet
        })
    }

    const toggleSelectAll = () => {
        if (selectedContacts.size === parsedContacts.length) {
            setSelectedContacts(new Set())
        } else {
            setSelectedContacts(new Set(parsedContacts.map((_, index) => index)))
        }
    }

    const isAllSelected = parsedContacts.length > 0 && selectedContacts.size === parsedContacts.length
    const isIndeterminate = selectedContacts.size > 0 && selectedContacts.size < parsedContacts.length

    // Set indeterminate state on checkbox
    useEffect(() => {
        if (selectAllCheckboxRef.current) {
            selectAllCheckboxRef.current.indeterminate = isIndeterminate
        }
    }, [isIndeterminate])

    const uploadContacts = async () => {
        if (!file || parsedContacts.length === 0) {
            toast.error("Please select a valid file with contacts")
            return
        }

        if (selectedContacts.size === 0) {
            toast.error("Please select at least one contact to upload")
            return
        }

        if (!listName.trim()) {
            toast.error("Please enter a name for this contact list")
            return
        }

        setIsUploading(true)
        try {
            // Get selected contacts
            const selectedContactsArray = Array.from(selectedContacts).map(index => parsedContacts[index])

            // Create contact list record
            const { data: listData, error: listError } = await supabase
                .from('contact_lists')
                .insert({
                    name: listName.trim(),
                    file_name: file.name,
                    total_contacts: selectedContactsArray.length,
                    status: 'active'
                })
                .select()
                .single()

            if (listError) {
                if (listError.code === '23505' || listError.message.includes('duplicate') || listError.message.includes('unique')) {
                    toast.error(`A contact list with the name "${listName.trim()}" already exists. Please use a different name.`)
                    setIsUploading(false)
                    return
                }
                throw listError
            }

            // Insert contacts
            const contactsToInsert = selectedContactsArray.map(contact => ({
                contact_list_id: listData.id,
                name: contact.name,
                phone: contact.phone,
                email: contact.email || null,
                additional_data: Object.keys(contact)
                    .filter(k => !['name', 'phone', 'email'].includes(k))
                    .reduce((acc, k) => ({ ...acc, [k]: contact[k] }), {})
            }))

            // Insert in batches to avoid payload size limits
            const batchSize = 100
            let uploadedCount = 0
            for (let i = 0; i < contactsToInsert.length; i += batchSize) {
                const batch = contactsToInsert.slice(i, i + batchSize)
                const { data, error: contactsError } = await supabase
                    .from('contacts')
                    .insert(batch)
                    .select()

                if (contactsError) {
                    if (contactsError.code === '23505' || contactsError.message.includes('duplicate') || contactsError.message.includes('unique')) {
                        // Skip duplicates and continue
                        console.warn(`Skipping duplicate contacts in batch ${i / batchSize + 1}`)
                        continue
                    }
                    throw contactsError
                }
                
                if (data) {
                    uploadedCount += data.length
                }
            }

            // Update the contact list with actual uploaded count
            if (uploadedCount !== selectedContactsArray.length) {
                await supabase
                    .from('contact_lists')
                    .update({ total_contacts: uploadedCount })
                    .eq('id', listData.id)
            }

            toast.success(`Successfully uploaded ${uploadedCount} contact${uploadedCount !== 1 ? 's' : ''}`)
            setFile(null)
            setParsedContacts([])
            setSelectedContacts(new Set())
            setListName("")
            fetchContactLists()
        } catch (err: any) {
            console.error("Error uploading contacts:", err)
            toast.error(err.message || "Failed to upload contacts")
        } finally {
            setIsUploading(false)
        }
    }

    const handleStartCalling = async (listId?: string) => {
        setIsCalling(true)
        try {
            const result = await startCallingContacts(listId)
            
            if (result.success) {
                toast.success(
                    `Started calling: ${result.successCount} initiated, ${result.failedCount} failed`,
                    {
                        description: result.errors.length > 0 
                            ? `Some errors: ${result.errors.join(', ')}`
                            : undefined
                    }
                )
            } else {
                toast.error(result.error || "Failed to start calling")
            }
        } catch (error: any) {
            console.error("Error starting calls:", error)
            toast.error("Error starting calls: " + error.message)
        } finally {
            setIsCalling(false)
        }
    }

    const downloadTemplate = (format: 'csv' | 'xlsx') => {
        const headers = ['name', 'phone', 'email']
        const sampleData = [
            ['John Doe', '1234567890', 'john@example.com'],
            ['Jane Smith', '0987654321', 'jane@example.com']
        ]

        if (format === 'csv') {
            const csvContent = [headers, ...sampleData]
                .map(row => row.map(cell => `"${cell}"`).join(','))
                .join('\n')
            
            const blob = new Blob([csvContent], { type: 'text/csv' })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'contact_template.csv'
            a.click()
            window.URL.revokeObjectURL(url)
        } else {
            const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData])
            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, 'Contacts')
            XLSX.writeFile(wb, 'contact_template.xlsx')
        }
    }

    return (
        <div className="flex flex-col h-full gap-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Manage Contact Lists</h1>
                    <p className="text-muted-foreground">Upload and manage your contact files</p>
                </div>
            </div>

            {/* Upload Section */}
            <Card className="border-2 border-dashed border-primary/30">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Upload className="h-5 w-5 text-primary" />
                        <CardTitle>Upload Contact File (CSV or XLSX)</CardTitle>
                    </div>
                    <CardDescription>
                        Required columns: <strong>name</strong>, <strong>phone</strong> (or number/mobile). Optional: <strong>email</strong> and any additional columns.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                        isDragActive ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'
                    }`}>
                        <input {...getInputProps()} />
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-2">
                            {file ? file.name : "Drag & drop a file here, or click to select"}
                        </p>
                        <Button variant="outline" size="sm">
                            Choose File
                        </Button>
                    </div>

                    {file && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{file.name}</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setFile(null)
                                        setParsedContacts([])
                                        setSelectedContacts(new Set())
                                        setListName("")
                                    }}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            {parsedContacts.length > 0 && (
                                <>
                                    <Input
                                        placeholder="Enter contact list name"
                                        value={listName}
                                        onChange={(e) => setListName(e.target.value)}
                                        className="max-w-md"
                                    />
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-muted-foreground">
                                            {selectedContacts.size} of {parsedContacts.length} contacts selected
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                onClick={uploadContacts}
                                                disabled={isUploading || !listName.trim() || selectedContacts.size === 0}
                                            >
                                                {isUploading ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Uploading...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload className="mr-2 h-4 w-4" />
                                                        Upload {selectedContacts.size} Contact{selectedContacts.size !== 1 ? 's' : ''}
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    <div className="flex items-center gap-2 pt-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadTemplate('csv')}
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Download CSV Template
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadTemplate('xlsx')}
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Download XLSX Template
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Parsed Contacts Table */}
            {parsedContacts.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Parsed Contacts</CardTitle>
                                <CardDescription>
                                    Review and select contacts to upload ({selectedContacts.size} of {parsedContacts.length} selected)
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    ref={selectAllCheckboxRef}
                                    checked={isAllSelected}
                                    onCheckedChange={toggleSelectAll}
                                />
                                <span className="text-sm text-muted-foreground">
                                    Select All
                                </span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border max-h-[500px] overflow-auto">
                            <Table>
                                <TableHeader className="sticky top-0 bg-background z-10">
                                    <TableRow>
                                        <TableHead className="w-[50px]">
                                            <Checkbox
                                                ref={selectAllCheckboxRef}
                                                checked={isAllSelected}
                                                onCheckedChange={toggleSelectAll}
                                            />
                                        </TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Phone</TableHead>
                                        <TableHead>Email</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {parsedContacts.map((contact, index) => (
                                        <TableRow key={index} className="cursor-pointer hover:bg-muted/50" onClick={() => toggleSelectContact(index)}>
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <Checkbox
                                                    checked={selectedContacts.has(index)}
                                                    onCheckedChange={() => toggleSelectContact(index)}
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium">{contact.name}</TableCell>
                                            <TableCell>{contact.phone}</TableCell>
                                            <TableCell className="text-muted-foreground">{contact.email || "—"}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Contact Lists */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Your Contact Lists</h2>
                    <div className="flex items-center gap-2">
                        {contactLists.length > 0 && (
                            <Button
                                onClick={() => handleStartCalling()}
                                disabled={isCalling}
                                variant="default"
                                className="bg-primary hover:bg-primary/90"
                            >
                                {isCalling ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Starting Calls...
                                    </>
                                ) : (
                                    <>
                                        <PhoneCall className="mr-2 h-4 w-4" />
                                        Start Calling All
                                    </>
                                )}
                            </Button>
                        )}
                        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    </div>
                </div>

                {isLoading ? (
                    <Card>
                        <CardContent className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </CardContent>
                    </Card>
                ) : contactLists.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                <FileText className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <p className="text-muted-foreground">No contact lists yet. Upload a file to get started.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>List Name</TableHead>
                                        <TableHead>File Name</TableHead>
                                        <TableHead>Total Contacts</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {contactLists.map((list) => (
                                        <TableRow key={list.id}>
                                            <TableCell className="font-medium">{list.name}</TableCell>
                                            <TableCell className="text-muted-foreground">{list.file_name}</TableCell>
                                            <TableCell>{list.total_contacts}</TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {format(new Date(list.created_at), 'MMM dd, yyyy')}
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                                    list.status === 'active' 
                                                        ? 'bg-emerald-500/10 text-emerald-500' 
                                                        : 'bg-muted text-muted-foreground'
                                                }`}>
                                                    {list.status === 'active' && <CheckCircle2 className="h-3 w-3" />}
                                                    {list.status}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleStartCalling(list.id)}
                                                        disabled={isCalling}
                                                    >
                                                        {isCalling ? (
                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <PhoneCall className="mr-1 h-3 w-3" />
                                                                Call
                                                            </>
                                                        )}
                                                    </Button>
                                                    <Button variant="ghost" size="sm">
                                                        View
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
