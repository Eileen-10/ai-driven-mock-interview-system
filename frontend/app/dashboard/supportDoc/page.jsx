"use client"
import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { createClient } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Upload, LoaderCircle } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Create a Supabase client using public anon key
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_KEY
)

function SupportDoc() {
    const [file, setFile] = useState(null)
    const [uploading, setUploading] = useState(false)
    const [uploadedURL, setUploadedURL] = useState(null)
    const [openPrompt, setOpenPrompt] = useState(false)
    const { user } = useUser()
    const [fileList, setFileList] = useState([])

    useEffect(() => {
        if (user) {
          fetchUserFiles()
        }
    }, [user, uploadedURL])
    
    async function handleUpload(e) {
        e.preventDefault()
        if (!file || !user) return

        setUploading(true)

        const fileExt = file.name.split('.').pop()
        const filePath = `support_docs/${user.id}/${Date.now()}.${fileExt}`

        const { error } = await supabase.storage
        .from('mock-iv-sessions')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
        })

        if (error) {
        console.error('Upload error:', error)
        } else {
        const { data: { publicUrl } } = supabase
            .storage
            .from('mock-iv-sessions')
            .getPublicUrl(filePath)

        setUploadedURL(publicUrl)
        console.log('Uploaded to:', publicUrl)
        }

        setUploading(false)
        setOpenPrompt(false)
    }

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  async function fetchUserFiles() {
    if (!user) return
  
    const folderPath = `support_docs/${user.id}`
    const { data, error } = await supabase.storage
      .from("mock-iv-sessions")
      .list(folderPath, {
        limit: 100,
        offset: 0,
        sortBy: { column: "created_at", order: "desc" },
      })
  
    if (error) {
      console.error("Error listing files:", error)
      return
    }
  
    // Generate public URLs
    const filesWithUrls = data.map(file => {
      const { data: { publicUrl } } = supabase
        .storage
        .from("mock-iv-sessions")
        .getPublicUrl(`${folderPath}/${file.name}`)
  
      return {
        name: file.name,
        url: publicUrl,
        updatedAt: new Date().toLocaleString()
      }
    })
  
    setFileList(filesWithUrls)
  }

  return (
    <div className='px-12 py-8'>
      <h2 className='font-bold text-xl'>Supporting Document Center</h2>
      <h2 className='text-sm italic pt-1 text-gray-500'>Upload your resume, CVs, cover letter, or any other job application materials for a more personalised mock interview experience! 🎯</h2>
      <div className='grid grid-cols-1 md:grid-cols-5 my-5'>
        <div className='p-2 border rounded-lg bg-[#05060B] hover:scale-105 hover:shadow-md cursor-pointer transition-all'
        onClick={()=>setOpenPrompt(true)}>
            <div className="flex items-center justify-center space-x-2">
                <Upload className="text-white w-4 h-4" />
                <span className="font-bold text-white text-sm">Upload</span>
            </div>
        </div>
        <Dialog open={openPrompt}>
            <DialogContent className="max-w-xl [&>button]:hidden">
                <DialogHeader>
                    <DialogTitle className='text-xl'>Please upload your supporting document here</DialogTitle>
                    <DialogDescription>
                        <form onSubmit={handleUpload}>
                        <div>
                            <div className='mb-3'>
                                <div className='text-xs mb-2 italic'>e.g. Resume, CV, Cover Letter, ..</div>
                                <div className="grid w-full max-w-sm items-center gap-1.5">
                                    <Input id="supportDoc" type="file" accept="application/pdf" className="bg-gray-100 p-2 rounded-md" 
                                    onChange={handleFileChange}/>
                                </div>
                                <div className='text-xs mt-1 italic'>** PDF format ONLY</div>
                            </div>
                        </div>
                        <div className='flex gap-5 justify-center'>
                            <Button type="button" variant="outline" onClick={()=>setOpenPrompt(false)}>Cancel</Button>
                            <Button type="submit" disabled={uploading || !file}>
                                {uploading?
                                <>
                                <LoaderCircle className='animate-spin'/>Saving document..
                                </>:'Upload'
                                }
                            </Button>
                        </div>
                        </form>
                    </DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>
      </div>
      <div className="mt-6">
        <Table>
            <TableHeader>
            <TableRow>
                <TableHead>File Name</TableHead>
                <TableHead>Upload Date</TableHead>
                <TableHead>Link</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {fileList.length === 0 ? (
                <TableRow>
                <TableCell colSpan={3} className="text-center text-sm text-gray-500">
                    No supporting documents uploaded yet.
                </TableCell>
                </TableRow>
            ) : (
                fileList.map((file, index) => (
                <TableRow key={index}>
                    <TableCell>{file.name}</TableCell>
                    <TableCell>{file.updatedAt}</TableCell>
                    <TableCell>
                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                        View
                    </a>
                    </TableCell>
                </TableRow>
                ))
            )}
            </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default SupportDoc

// "use client"
// import { useState } from 'react'
// import { useUser } from '@clerk/nextjs'
// import { createClient } from '@supabase/supabase-js'

// // Create a Supabase client using public anon key
// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL,
//   process.env.NEXT_PUBLIC_SUPABASE_KEY
// )

// export default function UploadSupportDoc() {
//   const [file, setFile] = useState(null)
//   const [uploading, setUploading] = useState(false)
//   const [uploadedURL, setUploadedURL] = useState(null)

//   const { user } = useUser()

//   async function handleUpload(e) {
//     e.preventDefault()
//     if (!file || !user) return

//     setUploading(true)

//     const fileExt = file.name.split('.').pop()
//     const filePath = `support_docs/${user.id}/${Date.now()}.${fileExt}`

//     const { error } = await supabase.storage
//       .from('mock-iv-sessions')
//       .upload(filePath, file, {
//         cacheControl: '3600',
//         upsert: false,
//       })

//     if (error) {
//       console.error('Upload error:', error)
//     } else {
//       const { data: { publicUrl } } = supabase
//         .storage
//         .from('mock-iv-sessions')
//         .getPublicUrl(filePath)

//       setUploadedURL(publicUrl)
//     }

//     setUploading(false)
//   }

//   return (
//     <div>
//       <h1>Upload PDF File</h1>

//       <form onSubmit={handleUpload}>
//         <input
//           type="file"
//           accept="application/pdf"
//           onChange={(e) => setFile(e.target.files[0])}
//         />
//         <button type="submit" disabled={uploading || !file}>
//           {uploading ? 'Uploading...' : 'Upload'}
//         </button>
//       </form>

//       {uploadedURL && (
//         <p>Uploaded successfully: <a href={uploadedURL} target="_blank" rel="noopener noreferrer">{uploadedURL}</a></p>
//       )}
//     </div>
//   )
// }
