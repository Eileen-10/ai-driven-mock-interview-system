"use client"
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogDescription, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Switch } from "@/components/ui/switch"
import { db } from '@/utils/db'
import { InterviewPrompt } from '@/utils/schema'
import { eq } from 'drizzle-orm'
import { Camera, CameraOffIcon, Lightbulb, Mic, Settings, SlidersHorizontalIcon, Video } from 'lucide-react'
import Link from 'next/link'
import React, { useEffect, useState, useRef } from 'react'
import Webcam from 'react-webcam'

function InterviewSession({params}) {
    const [interviewData, setInterviewData]=useState();
    const [webcamEnabled, setWebcamEnabled]=useState(false);
    const [micEnabled, setMicEnabled]=useState(false);
    const [recordingEnabled, setRecordingEnabled]=useState(false);

    const [availableCameras, setAvailableCameras] = useState([]);
    const [availableMicrophones, setAvailableMicrophones] = useState([]);
    const [selectedCamera, setSelectedCamera] = useState("");
    const [selectedMicrophone, setSelectedMicrophone] = useState("");
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const webcamRef = useRef(null);

    useEffect(()=>{
        console.log(params.sessionId);
        GetInterviewDetails();
        fetchDevices();
    },[])

    // Get Interview Prompt Details by mockID/sessionId
    const GetInterviewDetails=async(e)=>{
        const result=await db.select()
        .from(InterviewPrompt)
        .where(eq(InterviewPrompt.mockID,params.sessionId))

        console.log(result)
        setInterviewData(result[0]);
    }

    // Fetch all available devices
    const fetchDevices = async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const cameras = devices.filter(device => device.kind === "videoinput");
            const microphones = devices.filter(device => device.kind === "audioinput");
        
            console.log("Fetched Devices:");
            devices.forEach(device => {
                console.log(`${device.kind}: ${device.label || "Unnamed Device"} (ID: ${device.deviceId})`);
            });
          
            setAvailableCameras(cameras);
            setAvailableMicrophones(microphones);
        
            if (cameras.length > 0){setSelectedCamera(cameras[0].deviceId)}
            if (microphones.length > 0){setSelectedMicrophone(microphones[0].deviceId)}
        } catch (error) {
            console.error("Error fetching media devices:", error);
        }
    };

    // When Settings(Configure devices) button is clicked
    const handleOpenSettings = async () => {
        try {
            // Request microphone access (at minimum)
            await navigator.mediaDevices.getUserMedia({ audio: true });
    
            await fetchDevices();   // Fetch available devices after permission is granted
            setIsSettingsOpen(true);
        } catch (error) {
            console.error("Error requesting media access:", error);
            alert("There is no device to be configured. Please allow at least microphone access to configure devices.");
        }
    };
    
    // Save device configurations
    const handleDeviceChange = async () => {
        try {
            // Stop the existing stream if active
            if (webcamRef.current && webcamRef.current.video.srcObject) {
                let tracks = webcamRef.current.video.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            }
            
            // Determine media constraints based on selected devices
            const mediaConstraints = {
                video: selectedCamera ? { deviceId: { exact: selectedCamera } } : false, 
                audio: selectedMicrophone ? { deviceId: { exact: selectedMicrophone } } : false
            };

            // Request new media stream based on available permissions
            const newStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);

            // Apply the new stream to the webcam component (if video is available)
            if (webcamRef.current && mediaConstraints.video) {
                webcamRef.current.video.srcObject = newStream;
            }

            setWebcamEnabled(!!selectedCamera);
            setMicEnabled(!!selectedMicrophone);
            setIsSettingsOpen(false);
        
        } catch (error) {
          console.error("Error accessing media devices:", error);
        }
    };

    // Ask for Mic permission
    const handleMicToggle = async (checked) => {
        if (checked) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setMicEnabled(true);
          } catch (error) {
            console.error("Microphone access denied:", error);
            setMicEnabled(false);
          }
        } else {
          setMicEnabled(false);
        }
    };

    // Alert for starting session (Mic MUST be enabled)
    const handleStartSession = async () => {
        try {
            // Request access to the microphone
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
            if (!stream) {
                alert("Please enable your microphone to start the session.");
                return;
            }
    
            // Continue with the session start logic
            console.log("Session started...");
        } catch (error) {
            console.error("Microphone access denied:", error);
            alert("Microphone access is required to start the session. Please grant permission.");
        }
    };    

    return (
        <div className='flex flex-col justify-center items-center w-full h-full'>
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-5 w-full max-w-7xl p-5 overflow-auto '>
                    <div className='flex flex-col bg-[#F2465E]/10 rounded-2xl border border-black px-8 py-6 justify-between h-auto'>
                        <div className='flex flex-col gap-0'>
                            <h2 className='font-bold text-lg'>Session Details</h2>
                            <h2 className='italic text-xs text-gray-600'>Key details of your mock interview session.</h2>
                            <h2 className='text-base mt-5'><strong>Job Role/Position: </strong>{interviewData?.jobRole}</h2>
                            <h2 className='text-base mt-3'><strong>Job Scope/Description: </strong>{interviewData?.jobDesc}</h2>
                            <h2 className='text-base mt-3'><strong>Question Type: </strong>{interviewData?.quesType}</h2>
                            <h2 className='text-base mt-3'><strong>Supporting Document: </strong>{interviewData?.supportingDoc}</h2>
                        </div>
                        <div className='p-5 border rounded-lg border-black bg-[#40E0D0] text-black flex items-start gap-3'>
                            <div className='mt-1'>
                                <Lightbulb fill='#F9F6B1'/>
                            </div>
                            <div className='flex flex-col mt-1'>
                                <h2 className='text-base'><strong>Information</strong></h2>
                                <h2 className='text-sm  mt-1'>Microphone permission <strong>MUST</strong> be enabled before starting the session. <br />Camera permission and recording are optional.</h2>
                                <h2 className='italic text-sm mt-2'><strong>Note:</strong> Webcam and recording can be disabled at any time during the session.</h2>
                            </div>
                        </div>
                    </div>
                    <div className='flex flex-col h-full gap-3 w-full'>
                        <div className='flex-1 bg-[#05060B] rounded-2xl border border-black px-8 py-6'>
                            <div className='flex flex-col gap-0'>
                                <h2 className='font-bold text-lg text-white'>Camera Preview</h2>
                                <h2 className='italic text-xs text-gray-200'>Enable for a more immersive interview experience.</h2>
                            </div>
                            <div className='flex flex-col items-center justify-center'>
                                {webcamEnabled? <Webcam
                                onUserMedia={()=>setWebcamEnabled(true)}
                                onUserMediaError={()=>setWebcamEnabled(false)}
                                audio={micEnabled}
                                mirrored={true}
                                ref={webcamRef}
                                style={{
                                    height:200,
                                    width:300
                                }}
                                className='mt-3'
                                />
                                :
                                <>
                                <CameraOffIcon className='h-40 w-60 my-3 p-10 bg-secondary rounded-lg'/>
                                </>
                                }
                            </div>
                        </div>
                        <div className='flex-1 bg-[#05060B] rounded-2xl border border-black px-8 pt-6 pb-4'>
                            <div className='flex flex-col gap-0'>
                                <h2 className='font-bold text-lg text-white'>Session Configuration</h2>
                                <h2 className='italic text-xs text-gray-200'>Adjust your session settings here.</h2>
                            </div>
                            <div className='flex flex-col gap-1 mt-3'>
                                <div className='flex items-center justify-between p-2 rounded-lg'>
                                    <div className='flex items-center gap-5'>
                                        <Camera className='text-white' size={24} />
                                        <div className='flex flex-col gap-0'>
                                            <h2 className='font-bold text-white text-sm'>Camera</h2>
                                            <h2 className={`${webcamEnabled ? "text-green-400" : "text-red-400"} text-xs`}>{webcamEnabled ? "Enabled" : "Disabled"}</h2>
                                        </div>
                                    </div>
                                    <Switch 
                                        checked={webcamEnabled}
                                        onCheckedChange={setWebcamEnabled}
                                        className="data-[state=checked]:bg-green-500 mr-2"
                                    />
                                </div>
                                <div className='flex items-center justify-between p-2 rounded-lg'>
                                    <div className='flex items-center gap-5'>
                                        <Mic className='text-white' size={24} />
                                        <div className='flex flex-col gap-0'>
                                            <h2 className='font-bold text-white text-sm'>Microphone</h2>
                                            <h2 className={`${micEnabled ? "text-green-400" : "text-red-400"} text-xs`}>{micEnabled ? "Enabled" : "Disabled"}</h2>
                                        </div>
                                    </div>
                                    <Switch 
                                        checked={micEnabled} 
                                        onCheckedChange={handleMicToggle}
                                        className="data-[state=checked]:bg-green-500 mr-2"
                                    />
                                </div>
                                <div className='flex items-center justify-between p-2 rounded-lg'>
                                    <div className='flex items-center gap-5'>
                                        <Video className='text-white' size={24} />
                                        <div className='flex flex-col gap-0'>
                                            <h2 className='font-bold text-white text-sm'>Record Session</h2>
                                            <h2 className={`${recordingEnabled ? "text-green-400" : "text-red-400"} text-xs`}>{recordingEnabled ? "Enabled" : "Disabled"}</h2>
                                        </div>
                                    </div>
                                    <Switch 
                                        checked={recordingEnabled} 
                                        onCheckedChange={setRecordingEnabled}
                                        className="data-[state=checked]:bg-green-500 mr-2"
                                    />
                                </div>
                                <div className='flex items-center justify-between p-2 rounded-lg'>
                                    <div className='flex items-center gap-5'>
                                        <Settings className='text-white' size={24} />
                                        <div className='flex flex-col gap-0'>
                                            <h2 className='font-bold text-white text-sm'>Settings</h2>
                                            <h2 className='text-xs text-gray-200'>Configure devices</h2>
                                        </div>
                                    </div>
                                    <Button onClick={handleOpenSettings} className='ml-auto rounded-full bg-gray-300 hover:bg-gray-400 p-3'><SlidersHorizontalIcon className='text-black' /></Button>
                                    <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Configure Devices</DialogTitle>
                                                <DialogDescription className='italic text-xs'>
                                                    Make changes to your device configuration here. Save when you're done.
                                                </DialogDescription>
                                            </DialogHeader>

                                            {availableCameras.length > 0 && selectedCamera && (
                                            <div className="mt-3">
                                                <label className="font-bold">Camera</label>
                                                <Select value={selectedCamera} onValueChange={setSelectedCamera}>
                                                    <SelectTrigger className="w-full bg-gray-100">
                                                        <SelectValue placeholder="Select a Camera" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {availableCameras.map((camera) => (
                                                            <SelectItem key={camera.deviceId} value={camera.deviceId}>
                                                                {camera.label || "Unknown Camera"}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            )}

                                            <div className="mt-3">
                                                <label className="font-bold">Microphone</label>
                                                <Select value={selectedMicrophone} onValueChange={setSelectedMicrophone}>
                                                    <SelectTrigger className="w-full bg-gray-100">
                                                        <SelectValue placeholder="Select a Microphone" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {availableMicrophones.map((mic) => (
                                                            <SelectItem key={mic.deviceId} value={mic.deviceId}>
                                                                {mic.label || "Unknown Microphone"}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <DialogFooter className="mt-5">
                                                <Button onClick={handleDeviceChange}>Save</Button>
                                                <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>Close</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>;
                                </div>
                            </div>
                            <div className='flex flex-col justify-center items-center gap-2'>
                                <Link href={'/dashboard/mockInterview/interviewSession/'+params.sessionId+'/start'}>
                                <Button onClick={handleStartSession}>Start Now</Button>
                                </Link>
                                <h2 className='italic text-[10px] text-gray-200'>All the best! ✨</h2>
                            </div>
                            
                        </div>
                    </div>
                </div>
        </div>
  )
}

export default InterviewSession