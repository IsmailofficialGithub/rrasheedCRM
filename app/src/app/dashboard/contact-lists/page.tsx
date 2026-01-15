"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, Download, Loader2, Users, FileText, AlertCircle, CheckCircle2, X, PhoneCall, ChevronDown, ChevronRight, Calendar, Play, Square, Pause, List } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { useDropzone } from "react-dropzone"
import Papa from "papaparse"
import * as XLSX from "xlsx"
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"
import { startCallingContacts, runCallList, startCallList, stopCallList, cancelCallList } from "./actions"
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
    const [schedulingListId, setSchedulingListId] = useState<string | null>(null)
    const [listStatuses, setListStatuses] = useState<Map<string, string>>(new Map()) // Track list statuses
    const [activeTab, setActiveTab] = useState<'all' | 'scheduled' | 'in_progress' | 'paused' | 'completed'>('all')
    const [allLists, setAllLists] = useState<ContactList[]>([]) // Store all lists
    const [parsedContacts, setParsedContacts] = useState<ContactRow[]>([])
    const [selectedContacts, setSelectedContacts] = useState<Set<number>>(new Set())
    const [listName, setListName] = useState("")
    const [selectedListId, setSelectedListId] = useState<string | null>(null)
    const [expandedLists, setExpandedLists] = useState<Set<string>>(new Set())
    const [listContacts, setListContacts] = useState<Map<string, any[]>>(new Map())
    const [loadingContacts, setLoadingContacts] = useState<Set<string>>(new Set())
    const selectAllCheckboxRef = useRef<HTMLButtonElement>(null)

    const supabase = createClient()

    const fetchContactLists = useCallback(async (tab?: 'all' | 'scheduled' | 'in_progress' | 'paused' | 'completed') => {
        const currentTab = tab || activeTab
        setIsLoading(true)
        try {
            // Fetch all contact lists
            const { data: allLists, error: listsError } = await supabase
                .from('contact_lists')
                .select('*')
                .order('created_at', { ascending: false })

            if (listsError) throw listsError

            // Use the status from contact_lists table directly
            // No need to check scheduled_calls - the list status is stored in contact_lists.status
            const statusMap = new Map<string, string>()
            
            if (allLists) {
                allLists.forEach(list => {
                    // Use the status from the list itself
                    if (list.status && list.status !== 'active') {
                        statusMap.set(list.id, list.status)
                    }
                })
            }

            setListStatuses(statusMap)
            setAllLists(allLists as ContactList[])

            // Filter lists based on active tab
            let filteredLists: ContactList[] = []
            
            if (currentTab === 'all') {
                // Show all lists
                filteredLists = allLists as ContactList[]
            } else if (currentTab === 'scheduled') {
                // Show only lists with scheduled status
                filteredLists = (allLists || []).filter(
                    list => list.status === 'scheduled'
                )
            } else if (currentTab === 'in_progress') {
                // Show only lists with ongoing status (contact_lists uses 'ongoing' but scheduled_calls uses 'in_progress')
                filteredLists = (allLists || []).filter(
                    list => list.status === 'ongoing'
                )
            } else if (currentTab === 'paused') {
                // Show only lists with paused status
                filteredLists = (allLists || []).filter(
                    list => list.status === 'paused'
                )
            } else if (currentTab === 'completed') {
                // Show only lists with completed status
                filteredLists = (allLists || []).filter(
                    list => list.status === 'completed'
                )
            }

            setContactLists(filteredLists as ContactList[])
        } catch (err: any) {
            console.error("Error fetching contact lists:", err)
            toast.error("Failed to fetch contact lists")
        } finally {
            setIsLoading(false)
        }
    }, [supabase, activeTab])

    useEffect(() => {
        fetchContactLists(activeTab)
    }, [fetchContactLists, activeTab])

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

            // Create contact list record with timestamp in name
            const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss')
            const listNameWithTimestamp = `${listName.trim()} [${timestamp}]`
            
            const { data: listData, error: listError } = await supabase
                .from('contact_lists')
                .insert({
                    name: listNameWithTimestamp,
                    file_name: file.name,
                    total_contacts: selectedContactsArray.length,
                    status: 'scheduled'
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

            // Check for duplicate phone numbers in the database
            const phoneNumbers = selectedContactsArray.map(c => c.phone)
            const { data: existingContacts } = await supabase
                .from('contacts')
                .select('phone')
                .in('phone', phoneNumbers)

            const existingPhones = new Set(existingContacts?.map(c => c.phone) || [])
            
            // Filter out duplicates
            const contactsToInsert = selectedContactsArray
                .filter(contact => !existingPhones.has(contact.phone))
                .map(contact => ({
                    contact_list_id: listData.id,
                    name: contact.name,
                    phone: contact.phone,
                    email: contact.email || null,
                    additional_data: Object.keys(contact)
                        .filter(k => !['name', 'phone', 'email'].includes(k))
                        .reduce((acc, k) => ({ ...acc, [k]: contact[k] }), {})
                }))

            const duplicateCount = selectedContactsArray.length - contactsToInsert.length
            
            if (duplicateCount > 0) {
                toast.warning(`${duplicateCount} duplicate phone number${duplicateCount !== 1 ? 's' : ''} skipped`)
            }

            if (contactsToInsert.length === 0) {
                toast.error("All contacts have duplicate phone numbers. No contacts to upload.")
                setIsUploading(false)
                return
            }

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

            // Get current user to create scheduled_calls
            const { data: { user } } = await supabase.auth.getUser()
            
            if (user && uploadedCount > 0) {
                // Get the uploaded contact IDs
                const { data: uploadedContacts, error: fetchContactsError } = await supabase
                    .from('contacts')
                    .select('id')
                    .eq('contact_list_id', listData.id)

                if (!fetchContactsError && uploadedContacts && uploadedContacts.length > 0) {
                    // Create scheduled_calls entries for all uploaded contacts
                    const scheduleTime = new Date()
                    const scheduledCallsToInsert = uploadedContacts.map(contact => ({
                        owner_user_id: user.id,
                        contact_id: contact.id,
                        list_id: listData.id,
                        scheduled_at: scheduleTime.toISOString(),
                        status: 'scheduled',
                    }))

                    const { error: scheduleError } = await supabase
                        .from('scheduled_calls')
                        .insert(scheduledCallsToInsert)

                    if (scheduleError) {
                        console.error("Error creating scheduled calls:", scheduleError)
                        // Don't fail the upload if scheduled calls creation fails
                    }
                }
            }

            const message = duplicateCount > 0 
                ? `Successfully uploaded ${uploadedCount} contact${uploadedCount !== 1 ? 's' : ''} (${duplicateCount} duplicate${duplicateCount !== 1 ? 's' : ''} skipped). List is now scheduled.`
                : `Successfully uploaded ${uploadedCount} contact${uploadedCount !== 1 ? 's' : ''}. List is now scheduled.`
            toast.success(message)
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

    const handleRunList = async (listId: string) => {
        setSchedulingListId(listId)
        try {
            const result = await runCallList(listId)
            
            if (result.success) {
                toast.success(
                    `List scheduled successfully`,
                    {
                        description: `${result.contactsCount} contacts scheduled for calling`
                    }
                )
                // Refresh contact lists - this list will now be hidden
                fetchContactLists()
            } else {
                toast.error(result.error || "Failed to run list")
            }
        } catch (error: any) {
            console.error("Error running list:", error)
            toast.error("Error running list: " + error.message)
        } finally {
            setSchedulingListId(null)
        }
    }

    const handleStartList = async (listId: string) => {
        setSchedulingListId(listId)
        try {
            const result = await startCallList(listId)
            
            if (result.success) {
                toast.success(
                    `List started`,
                    {
                        description: `${result.updatedCount} calls are now in progress`
                    }
                )
                fetchContactLists()
            } else {
                toast.error(result.error || "Failed to start list")
            }
        } catch (error: any) {
            console.error("Error starting list:", error)
            toast.error("Error starting list: " + error.message)
        } finally {
            setSchedulingListId(null)
        }
    }

    const handleStopList = async (listId: string) => {
        setSchedulingListId(listId)
        try {
            const result = await stopCallList(listId)
            
            if (result.success) {
                toast.success(
                    `List stopped`,
                    {
                        description: `${result.updatedCount} calls paused`
                    }
                )
                fetchContactLists()
            } else {
                toast.error(result.error || "Failed to stop list")
            }
        } catch (error: any) {
            console.error("Error stopping list:", error)
            toast.error("Error stopping list: " + error.message)
        } finally {
            setSchedulingListId(null)
        }
    }

    const handleCancelList = async (listId: string) => {
        setSchedulingListId(listId)
        try {
            const result = await cancelCallList(listId)
            
            if (result.success) {
                toast.success(
                    `List completed`,
                    {
                        description: `${result.updatedCount} calls marked as completed`
                    }
                )
                // Refresh - completed lists should appear again
                fetchContactLists()
            } else {
                toast.error(result.error || "Failed to cancel list")
            }
        } catch (error: any) {
            console.error("Error cancelling list:", error)
            toast.error("Error cancelling list: " + error.message)
        } finally {
            setSchedulingListId(null)
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

    const toggleExpandList = async (listId: string) => {
        if (expandedLists.has(listId)) {
            // Collapse
            setExpandedLists(prev => {
                const newSet = new Set(prev)
                newSet.delete(listId)
                return newSet
            })
        } else {
            // Expand - fetch contacts
            setExpandedLists(prev => new Set(prev).add(listId))
            setLoadingContacts(prev => new Set(prev).add(listId))
            
            try {
                const { data, error } = await supabase
                    .from('contacts')
                    .select('*')
                    .eq('contact_list_id', listId)
                    .order('created_at', { ascending: true })

                if (error) throw error

                setListContacts(prev => {
                    const newMap = new Map(prev)
                    newMap.set(listId, data || [])
                    return newMap
                })
            } catch (err: any) {
                console.error("Error fetching contacts:", err)
                toast.error("Failed to load contacts")
            } finally {
                setLoadingContacts(prev => {
                    const newSet = new Set(prev)
                    newSet.delete(listId)
                    return newSet
                })
            }
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
                        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    </div>
                </div>

                {/* Tabs for filtering lists */}
                <div className="flex items-center gap-2 mb-4 border-b">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                            activeTab === 'all'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <List className="h-4 w-4" />
                            All Lists
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('scheduled')}
                        className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                            activeTab === 'scheduled'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Scheduled
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('in_progress')}
                        className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                            activeTab === 'in_progress'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <Play className="h-4 w-4" />
                            In Progress
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('paused')}
                        className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                            activeTab === 'paused'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <Pause className="h-4 w-4" />
                            Paused
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('completed')}
                        className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                            activeTab === 'completed'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Completed
                        </div>
                    </button>
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
                                        <TableHead className="w-[50px]"></TableHead>
                                        <TableHead>List Name</TableHead>
                                        <TableHead>File Name</TableHead>
                                        <TableHead>Total Contacts</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {contactLists.map((list) => {
                                        const isExpanded = expandedLists.has(list.id)
                                        const contacts = listContacts.get(list.id) || []
                                        const isLoadingContacts = loadingContacts.has(list.id)
                                        
                                        return (
                                            <React.Fragment key={list.id}>
                                                <TableRow className="cursor-pointer hover:bg-muted/30" onClick={() => toggleExpandList(list.id)}>
                                                    <TableCell>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                toggleExpandList(list.id)
                                                            }}
                                                        >
                                                            {isExpanded ? (
                                                                <ChevronDown className="h-4 w-4" />
                                                            ) : (
                                                                <ChevronRight className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </TableCell>
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
                                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex items-center justify-end gap-2">
                                                            {(() => {
                                                                const listStatus = listStatuses.get(list.id)
                                                                const isProcessing = schedulingListId === list.id
                                                                
                                                                if (!listStatus) {
                                                                    // List not scheduled yet - show Run button
                                                                    return (
                                                                        <Button
                                                                            variant="default"
                                                                            size="sm"
                                                                            onClick={() => handleRunList(list.id)}
                                                                            disabled={isProcessing}
                                                                            className="bg-primary hover:bg-primary/90"
                                                                        >
                                                                            {isProcessing ? (
                                                                                <>
                                                                                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                                                                    Running...
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <Play className="mr-1 h-3 w-3" />
                                                                                    Run List
                                                                                </>
                                                                            )}
                                                                        </Button>
                                                                    )
                                                                } else if (listStatus === 'scheduled') {
                                                                    // List is scheduled - show Start button
                                                                    return (
                                                                        <Button
                                                                            variant="default"
                                                                            size="sm"
                                                                            onClick={() => handleStartList(list.id)}
                                                                            disabled={isProcessing}
                                                                            className="bg-green-600 hover:bg-green-700"
                                                                        >
                                                                            {isProcessing ? (
                                                                                <>
                                                                                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                                                                    Starting...
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <Play className="mr-1 h-3 w-3" />
                                                                                    Start
                                                                                </>
                                                                            )}
                                                                        </Button>
                                                                    )
                                                                } else if (listStatus === 'ongoing') {
                                                                    // List is in progress (contact_lists uses 'ongoing' but scheduled_calls uses 'in_progress') - show Stop and Cancel buttons
                                                                    return (
                                                                        <>
                                                                            <Button
                                                                                variant="outline"
                                                                                size="sm"
                                                                                onClick={() => handleStopList(list.id)}
                                                                                disabled={isProcessing}
                                                                            >
                                                                                {isProcessing ? (
                                                                                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                                                                ) : (
                                                                                    <>
                                                                                        <Pause className="mr-1 h-3 w-3" />
                                                                                        Stop
                                                                                    </>
                                                                                )}
                                                                            </Button>
                                                                            <Button
                                                                                variant="destructive"
                                                                                size="sm"
                                                                                onClick={() => handleCancelList(list.id)}
                                                                                disabled={isProcessing}
                                                                            >
                                                                                {isProcessing ? (
                                                                                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                                                                ) : (
                                                                                    <>
                                                                                        <Square className="mr-1 h-3 w-3" />
                                                                                        Cancel
                                                                                    </>
                                                                                )}
                                                                            </Button>
                                                                        </>
                                                                    )
                                                                } else if (listStatus === 'paused') {
                                                                    // List is paused - show Start and Cancel buttons
                                                                    return (
                                                                        <>
                                                                            <Button
                                                                                variant="default"
                                                                                size="sm"
                                                                                onClick={() => handleStartList(list.id)}
                                                                                disabled={isProcessing}
                                                                                className="bg-green-600 hover:bg-green-700"
                                                                            >
                                                                                {isProcessing ? (
                                                                                    <>
                                                                                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                                                                        Starting...
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        <Play className="mr-1 h-3 w-3" />
                                                                                        Resume
                                                                                    </>
                                                                                )}
                                                                            </Button>
                                                                            <Button
                                                                                variant="destructive"
                                                                                size="sm"
                                                                                onClick={() => handleCancelList(list.id)}
                                                                                disabled={isProcessing}
                                                                            >
                                                                                {isProcessing ? (
                                                                                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                                                                ) : (
                                                                                    <>
                                                                                        <Square className="mr-1 h-3 w-3" />
                                                                                        Cancel
                                                                                    </>
                                                                                )}
                                                                            </Button>
                                                                        </>
                                                                    )
                                                                }
                                                                return null
                                                            })()}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                                {isExpanded && (
                                                    <TableRow>
                                                        <TableCell colSpan={7} className="p-0 bg-muted/20">
                                                            <div className="p-4">
                                                                {isLoadingContacts ? (
                                                                    <div className="flex items-center justify-center py-4">
                                                                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                                                    </div>
                                                                ) : contacts.length === 0 ? (
                                                                    <div className="text-center py-4 text-muted-foreground text-sm">
                                                                        No contacts found in this list.
                                                                    </div>
                                                                ) : (
                                                                    <div className="space-y-2">
                                                                        <div className="text-sm font-semibold mb-3">
                                                                            Contacts ({contacts.length})
                                                                        </div>
                                                                        <div className="max-h-[400px] overflow-auto rounded-md border bg-background">
                                                                            <Table>
                                                                                <TableHeader>
                                                                                    <TableRow>
                                                                                        <TableHead className="w-[50px]">#</TableHead>
                                                                                        <TableHead>Name</TableHead>
                                                                                        <TableHead>Phone</TableHead>
                                                                                        <TableHead>Email</TableHead>
                                                                                    </TableRow>
                                                                                </TableHeader>
                                                                                <TableBody>
                                                                                    {contacts.map((contact, idx) => (
                                                                                        <TableRow key={contact.id}>
                                                                                            <TableCell className="text-muted-foreground text-xs">{idx + 1}</TableCell>
                                                                                            <TableCell className="font-medium">{contact.name}</TableCell>
                                                                                            <TableCell>{contact.phone}</TableCell>
                                                                                            <TableCell className="text-muted-foreground">{contact.email || "—"}</TableCell>
                                                                                        </TableRow>
                                                                                    ))}
                                                                                </TableBody>
                                                                            </Table>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </React.Fragment>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
