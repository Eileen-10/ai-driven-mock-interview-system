"use client"
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogDescription, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Switch } from "@/components/ui/switch"
import { db } from '@/utils/db'
import { InterviewPrompt } from '@/utils/schema'
import { eq } from 'drizzle-orm'
import { Camera, CameraOffIcon, Info, Lightbulb, Mic, Settings, SlidersHorizontalIcon, Video } from 'lucide-react'
import Link from 'next/link'
import React, { useEffect, useState, useRef } from 'react'
import Webcam from 'react-webcam'
import { useRouter } from 'next/navigation'

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
    const router=useRouter()

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
        setInterviewData(result[0]);    // Save prompt details as interviewData
    }

    const fetchDevices = async () => {
        try {
             // ##** Fetch all available devices **##
            const devices = await navigator.mediaDevices.enumerateDevices();
            const cameras = devices.filter(device => device.kind === "videoinput" && device.deviceId);
            const microphones = devices.filter(device => device.kind === "audioinput" && device.deviceId);
        
            console.log("Fetched Devices:");
            devices.forEach(device => {
                console.log(`${device.kind}: ${device.label || "Unnamed Device"} (ID: ${device.deviceId})`);
            });
          
            setAvailableCameras(cameras);           // Save list of available cameras
            setAvailableMicrophones(microphones);   // Save list of available mics
        
            // Fetch any saved selected device config
            const storedCamera = localStorage.getItem("selectedCamera");
            const storedMic = localStorage.getItem("selectedMicrophone");
            const storedRecordingStatus = localStorage.getItem("recordingEnabled");

            console.log(storedCamera)
            console.log(storedMic)
            console.log(storedRecordingStatus)
            
            // Update selected devices only if they are still available
            const validCamera = cameras.find(cam => cam.deviceId === storedCamera);
            const validMic = microphones.find(mic => mic.deviceId === storedMic);

            console.log(validCamera)
            console.log(validMic)

            if (validCamera) {
                setSelectedCamera(validCamera.deviceId);
            } else if (cameras.length > 0) {
                setSelectedCamera(cameras[0].deviceId);
            }
            if (interviewData?.conversationalMode) {
                setSelectedMicrophone("default");
            } else if (validMic) {
                setSelectedMicrophone(validMic.deviceId);
            } else if (microphones.length > 0) {
                setSelectedMicrophone(microphones[0].deviceId);
            }
            if (storedRecordingStatus !== null) {
                setRecordingEnabled(storedRecordingStatus === "true");
            }

            // ##** Update device permission status **##
            const micPermission = await navigator.permissions.query({ name: "microphone" });
            const camPermission = await navigator.permissions.query({ name: "camera" });

            if (micPermission.state === "granted") {setMicEnabled(true)} 
            if (camPermission.state === "granted") {setWebcamEnabled(true)}

        } catch (error) {
            console.error("Error fetching media devices:", error);
        }
    }; 

    useEffect(() => {
        console.log("availableMicrophone:", availableMicrophones)
        console.log("selectedMicrophone:", selectedMicrophone)
    }, [availableMicrophones, selectedMicrophone]);

    useEffect(() => {
        console.log("availableCamera:", availableCameras)
        console.log("selectedCamera:", selectedCamera)
    }, [availableCameras, selectedCamera]);
    
    
    // When Settings(Configure devices) button is clicked
    const handleOpenSettings = async () => {
        try {
            await fetchDevices();   // Fetch available devices
            const micPermission = await navigator.permissions.query({ name: "microphone" });
            const camPermission = await navigator.permissions.query({ name: "camera" });

            // If none permission granted
            if (micPermission.state !== "granted" && camPermission.state !== "granted"){
                // Request microphone access (at minimum)
                await navigator.mediaDevices.getUserMedia({ audio: true });
                await fetchDevices(); // Re-fetch devices after permission is granted
            }
            
            // Fetch any saved configurations
            const storedCamera = localStorage.getItem("selectedCamera");
            const storedMic = localStorage.getItem("selectedMicrophone");
            if (storedCamera) setSelectedCamera(storedCamera);
            if (storedMic) setSelectedMicrophone(storedMic);

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
            
            // Check permissions before requesting media
            const micPermission = await navigator.permissions.query({ name: "microphone" });
            const camPermission = await navigator.permissions.query({ name: "camera" });
            
            // Set media constraints based on permissions & selected devices
            const mediaConstraints = {};
            if (selectedCamera && camPermission.state === "granted") {
                mediaConstraints.video = { deviceId: { exact: selectedCamera } };
            }
            if (selectedMicrophone && micPermission.state === "granted") {
                mediaConstraints.audio = { deviceId: { exact: selectedMicrophone } };
            }

            console.log(mediaConstraints)

            // If no valid constraints exist, avoid calling getUserMedia
            if (Object.keys(mediaConstraints).length === 0) {
                console.warn("No valid media constraints. Skipping getUserMedia request.");
                return;
            }
            
            // Request new media stream only for enabled and permitted devices
            const newStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);

            // Apply the new stream to the webcam component (if video is available)
            if (webcamRef.current && mediaConstraints.video) {
                webcamRef.current.video.srcObject = newStream;
            }

            setWebcamEnabled(!!mediaConstraints.video);
            setMicEnabled(!!mediaConstraints.audio);
            setIsSettingsOpen(false);

            // Save configurations
            if (selectedCamera) localStorage.setItem("selectedCamera", selectedCamera);
            if (selectedMicrophone) localStorage.setItem("selectedMicrophone", selectedMicrophone);
        
        } catch (error) {
          console.error("Error accessing media devices:", error);
        }
    };

    // Ask for Mic permission
    const handleMicToggle = async (checked) => {
        if (checked) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (stream) {
                await fetchDevices();
                setMicEnabled(true);
            }

          } catch (error) {
            console.error("Microphone access denied:", error);
            setMicEnabled(false);
          }
        } else {
          setMicEnabled(false);
        }
    };

    const handleRecordingToggle = async (checked) => {
        setRecordingEnabled(checked);
        localStorage.setItem("recordingEnabled", checked); // Store recording state
    }

    // Alert for starting session (Mic MUST be enabled)
    const handleStartSession = async () => {
        
        // If mic enabled, proceed to start session
        if (micEnabled) {
            // Save selected devices before navigating
            localStorage.setItem("selectedMicrophone", selectedMicrophone);
            if (webcamEnabled) {
                localStorage.setItem("selectedCamera", selectedCamera);
            } else {
                localStorage.removeItem("selectedCamera") // Remove if only mic is used
            }
            
            // if (recordingEnabled) {
            //     // Open new tab for the start session
            //     const newTab = window.open('/dashboard/mockInterview/interviewSession/'+params.sessionId+'/start');
            //     if (!newTab) {
            //         alert("Popup blocked. Please allow popups for this site.");
            //         return;
            //     }

            // } else {
                router.push('/dashboard/mockInterview/interviewSession/'+params.sessionId+'/start');
            // }

        }
        
        // Else, try requesting for mic permission
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
            if (stream) {
                setMicEnabled(true);
                localStorage.setItem("selectedMicrophone", selectedMicrophone);
                if (webcamEnabled) {
                    localStorage.setItem("selectedCamera", selectedCamera);
                } else {
                    localStorage.removeItem("selectedCamera") // Remove if only mic is used
                }

                // if (recordingEnabled) {
                    // Open new tab for the start session
                    // const newTab = window.open('/dashboard/mockInterview/interviewSession/'+params.sessionId+'/start');
                    // if (!newTab) {
                    //     alert("Popup blocked. Please allow popups for this site.");
                    //     return;
                    // }
                    // screenStream = await navigator.mediaDevices.getDisplayMedia({
                    //     video: true,
                    //     audio: true // This will include system audio if user checks the box
                    // });
                    // Send stream to new tab using BroadcastChannel
                    // if (recordingEnabled && screenStream) {
                    //     const channel = new BroadcastChannel("screen-recording");
                    //     // We can't directly send MediaStream, but can notify to start recording in new tab
                    //     channel.postMessage("start-recording");
                    // }
                // } else {
                    router.push('/dashboard/mockInterview/interviewSession/'+params.sessionId+'/start');
                // }
                
            }
        
        // If permission rejected, alert mic requirement
        } catch (error) {
            console.error("Microphone access denied:", error);
            alert("Microphone access is required to start the session. Please grant permission.");

            // Request once again after the alert
            navigator.mediaDevices.getUserMedia({ audio: true })
            .then(() => {
                setMicEnabled(true);
            })
            .catch(() => {
                setMicEnabled(false);
            });
        }
    };    

    return (
        <div className='flex flex-col justify-center items-center w-full h-full'>
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-5 w-full max-w-7xl p-5 overflow-auto '>
                    <div className='flex flex-col bg-[#F2465E]/10 rounded-2xl border border-black px-8 py-6 justify-between h-auto'>
                        <div className='flex flex-col gap-0'>
                            <h2 className='font-bold text-lg'>Session Details</h2>
                            <h2 className='italic text-xs text-gray-600'>Key details of your mock interview session.</h2>
                            <h2 className='text-base mt-5'><strong>Job Role/Position: </strong>{interviewData?.jobRole ? interviewData.jobRole : '-'}</h2>
                            <h2 className='text-base mt-3'><strong>Job Scope/Description: </strong>{interviewData?.jobDesc ? interviewData.jobDesc : '-'}</h2>
                            <h2 className='text-base mt-3'><strong>Question Type: </strong>{interviewData?.quesType 
                            ? interviewData.quesType.charAt(0).toUpperCase() + interviewData.quesType.slice(1) 
                            : '-'}</h2>
                            <h2 className='text-base mt-3'><strong>Mode: </strong>{interviewData?.conversationalMode ? 'Conversational' : 'Default'}</h2>
                            {interviewData?.supportingDoc && (
                                <h2 className='text-base mt-3'><strong>Supporting Document: </strong>
                                {interviewData.supportingDocURL ? (
                                    <a
                                        href={interviewData.supportingDocURL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 underline hover:text-blue-800 italic"
                                    >
                                        {interviewData.supportingDoc}
                                    </a>
                                ) : (
                                    interviewData.supportingDoc
                                )}
                                </h2>
                            )}
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
                                audio={false}
                                mirrored={true}
                                ref={webcamRef}
                                videoConstraints={{
                                    deviceId: selectedCamera ? { exact: selectedCamera } : undefined
                                }}
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
                                        onCheckedChange={handleRecordingToggle}
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

                                            {availableCameras.length > 0 && selectedCamera !== "" && (
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

                                            {availableMicrophones.length > 0 && selectedMicrophone && (
                                            <div className="mt-3">
                                                <label className="font-bold">Microphone</label>
                                                <Select 
                                                value={interviewData?.conversationalMode ? "default" : selectedMicrophone}
                                                onValueChange={setSelectedMicrophone}
                                                disabled={interviewData?.conversationalMode}
                                                >
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
                                                {interviewData?.conversationalMode && (
                                                <div className='p-3 border rounded-lg border-black bg-[#40E0D0] text-black flex items-start mt-3'>
                                                    <Info fill='#F9F6B1' className='size-[15px] mr-2'/>
                                                    <h2 className='text-[10px]'>** Due to system limitation, only <strong>DEFAULT</strong> microphone device is supported for <strong>Conversational Mode.</strong><br />
                                                    If mic configuration is necessary, you must change the system-wide default audio input through the operating system's sound settings.</h2>
                                                </div>
                                                )}     
                                            </div>
                                            )}

                                            <DialogFooter className="mt-5">
                                                <Button onClick={handleDeviceChange}>Save</Button>
                                                <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>Close</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>;
                                </div>
                            </div>
                            <div className='flex flex-col justify-center items-center gap-2'>
                                <Button onClick={handleStartSession}>Start Now</Button>
                                <h2 className='italic text-[10px] text-gray-200'>All the best! ✨</h2>
                            </div>
                        </div>
                    </div>
                </div>
        </div>
  )
}

export default InterviewSession