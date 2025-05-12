"use client"
import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { createClient } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Upload, LoaderCircle, Trash2, CircleCheck, Circle } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { db } from '@/utils/db'
import { eq } from 'drizzle-orm'

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
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false)
  const [pendingFileInfo, setPendingFileInfo] = useState({ file: null, fileExt: '', fileName: '' })
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false)
  const [pendingDeleteFile, setPendingDeleteFile] = useState(null)

  useEffect(() => {
      if (user) {
        fetchUserFiles()
      }
  }, [user, uploadedURL])
    
  async function handleUpload(e) {
    e.preventDefault()
    if (!file || !user) return

    setUploading(true)

    const originalFileName = file.name;
    const fileExt = file.name.split('.').pop();

    // Step 1: Check if this user already uploaded a file with the same name
    const { data: existingFiles, error: checkError } = await supabase
      .from('supportDocs')
      .select('*')
      .eq('user_id', user.id)
      .eq('file_name', originalFileName);

    if (checkError) {
      console.error('Error checking for existing file:', checkError);
      setUploading(false);
      return;
    }

    // Exist duplicate (same filename)
    if (existingFiles.length > 0) {
      setPendingFileInfo({ file, fileExt, fileName: originalFileName });
      setShowDuplicateDialog(true);
      setUploading(false);
      return;
    }

    // No duplicate, proceed with uploading file
    await proceedWithUpload(file, fileExt, originalFileName);
  
  }

  async function proceedWithUpload(selectedFile, ext, originalFileName) {
    // Check if the user already has a default file
    const { data: defaultCheck } = await supabase
      .from('supportDocs')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_default', true);

    const isDefault = defaultCheck.length === 0;
    
    const uniqueSuffix = Date.now();
    const uniqueFileName = `${uniqueSuffix}.${ext}`;
    const filePath = `support_docs/${user.id}/${uniqueFileName}`;

    const { error: uploadError } = await supabase.storage
      .from('mock-iv-sessions')
      .upload(filePath, selectedFile, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return;
    }

    const { data: { publicUrl } } = supabase
      .storage
      .from('mock-iv-sessions')
      .getPublicUrl(filePath);

    const { error: dbError } = await supabase
      .from('supportDocs')
      .insert([{
        user_id: user.id,
        file_name: originalFileName,
        file_path: filePath,
        public_url: publicUrl,
        is_default: isDefault
      }]);

    if (dbError) {
      console.error('Error inserting into supportDocs:', dbError);
    } else {
      setUploadedURL(publicUrl);
      console.log('Uploaded and saved to DB');
    }

    setUploading(false);
    setOpenPrompt(false);
    setShowDuplicateDialog(false);
  }

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  async function fetchUserFiles() {
    if (!user) return
  
    const { data, error } = await supabase
    .from('supportDocs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching metadata:', error)
      return
    }

    const filesWithUrls = data.map(file => ({
      id: file.id,
      name: file.file_name,
      url: file.public_url,
      path: file.file_path,
      updatedAt: new Date(file.created_at).toLocaleString(),
      isDefault: file.is_default
    }))

    setFileList(filesWithUrls)
  }
  async function handleFileDeletion({ filePath, filePublicUrl }) {
    // 1. Delete file from Supabase Bucket Storage
    const { error: storageError } = await supabase
      .storage
      .from('mock-iv-sessions')
      .remove([filePath]);

    if (storageError) {
      console.error('Storage delete error:', storageError);
      return;
    }

    // 2. Delete data from supportDocs table
    const { error: dbError } = await supabase
      .from('supportDocs')
      .delete()
      .eq('file_path', filePath);

    if (dbError) {
      console.error('Database delete error:', dbError);
      return;
    }

    // 3. Clear matching supportingDocURL from InterviewPrompt
    await fetch('../api/supportingDoc/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicUrl: filePublicUrl }),
    });

    fetchUserFiles();
  }

  // Set default selected file
  async function setAsDefault(fileId) {
    if (!user) return;

    // 1. Unset all current default files for the user
    const { error: unsetError } = await supabase
      .from('supportDocs')
      .update({ is_default: false })
      .eq('user_id', user.id);

    if (unsetError) {
      console.error('Error unsetting defaults:', unsetError);
      return;
    }

    // 2. Set selected file as default
    const { error: setError } = await supabase
      .from('supportDocs')
      .update({ is_default: true })
      .eq('id', fileId);

    if (setError) {
      console.error('Error setting default:', setError);
    } else {
      fetchUserFiles();
    }
  }

  async function handleDelete(filePath, filePublicUrl) {
    setPendingDeleteFile({ filePath, filePublicUrl });
    setShowDeleteConfirmDialog(true);
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
        <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className='text-lg'>⚠️ Duplicate File Name</DialogTitle>
              <DialogDescription>
                You've already uploaded a file named "<strong>{pendingFileInfo.fileName}</strong>". <br/><br/>
                Please rename your file or delete the existing one first.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-4">
              <Button
                onClick={() =>
                  proceedWithUpload(pendingFileInfo.file, pendingFileInfo.fileExt, pendingFileInfo.fileName)
                }
              >
                Continue Anyway
              </Button>
              <Button variant="outline" onClick={() => setShowDuplicateDialog(false)}>
                OK
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={showDeleteConfirmDialog} onOpenChange={setShowDeleteConfirmDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg">⚠️ Confirm File Deletion</DialogTitle>
              <DialogDescription>
                Deleting the file will also remove the associated link
                from any mock interview sessions that reference to this file. <br /><br />Are you sure you want to proceed?
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={() => setShowDeleteConfirmDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  // Proceed with file deletion
                  await handleFileDeletion(pendingDeleteFile);
                  setShowDeleteConfirmDialog(false);
                }}
              >
                Yes, Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">Default</TableHead>
              <TableHead>File Name</TableHead>
              <TableHead>Upload Date</TableHead>
              <TableHead>Link</TableHead>
              <TableHead>Delete</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fileList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-sm text-gray-500">
                  No supporting documents uploaded yet.
                </TableCell>
              </TableRow>
            ) : (
              fileList.map((file, index) => (
                <TableRow key={index}>
                  <TableCell className="text-center">
                    {file.isDefault ? (
                      <CircleCheck
                        className="text-white cursor-default mx-auto"
                        fill="#16A34A"
                        strokeWidth={2.5}
                      />
                    ) : (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-full hover:bg-gray-100 mx-auto"
                              onClick={() => setAsDefault(file.id)}
                            >
                              <Circle className="text-gray-500" strokeWidth={2.5} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="bg-gray-500 text-white">
                            <p>Set as default</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </TableCell>
                  <TableCell>{file.name}</TableCell>
                  <TableCell>{file.updatedAt}</TableCell>
                  <TableCell>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-700 underline"
                    >
                      View
                    </a>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(file.path, file.url)}
                    >
                      <Trash2 />
                    </Button>
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