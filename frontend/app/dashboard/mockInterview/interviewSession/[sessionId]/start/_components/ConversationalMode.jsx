"use client"
import { useUser } from '@clerk/nextjs'
import React, { useEffect, useState } from 'react'
import { AudioWaveform, CaptionsOff, Info, Settings, Video, VideoOff } from 'lucide-react';
import { vapi } from "@/lib/vapi.sdk";
import { interviewer } from "@/constants";
import { cn } from "@/lib/utils";
import { useRouter } from 'next/navigation';
import Webcam from 'react-webcam';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent,  TooltipProvider,  TooltipTrigger } from "@/components/ui/tooltip"

const CallStatus = {
    INACTIVE: "INACTIVE",
    CONNECTING: "CONNECTING",
    ACTIVE: "ACTIVE",
    FINISHED: "FINISHED",
};

function ConversationalMode({mockInterviewQuestion, selectedCamera, setSelectedCamera, selectedMicrophone, setSelectedMicrophone, webcamRef, interviewData, params}) {
    const {user} = useUser()
    const router=useRouter()
    const [AIisSpeaking, setAIisSpeaking] = useState(false)
    const [UserisSpeaking, setUserisSpeaking] = useState(false)
    const [messages, setMessages] = useState([])
    const interviewerMessages = messages.filter((msg) => msg.role === "assistant");
    const userMessages = messages.filter((msg) => msg.role === "user");
    const [callStatus, setCallStatus] = useState(CallStatus.INACTIVE)
    const [availableCameras, setAvailableCameras] = useState([])
    const [availableMicrophones, setAvailableMicrophones] = useState([])
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const isCameraOn = Boolean(selectedCamera);
    const [isCaptionOn, setIsCaptionOn] = useState(true);

    useEffect(() => {
      console.log("All messages:", messages);
    }, [messages]);
    
    useEffect(() => {
      fetchDevices();

      const onCallStart = () => {
          setCallStatus(CallStatus.ACTIVE);
      };

      const onCallEnd = () => {
          setCallStatus(CallStatus.FINISHED);
      };
      
      const onMessage = (message) => {
        if (message.type === "transcript" && message.transcriptType === "final") {
          const newMessage = { role: message.role, content: message.transcript };
          setMessages((prev) => [...prev, newMessage]);
        }
      };
    
      const onSpeechStart = () => {
        console.log("Speech started");
        setAIisSpeaking(true);
        setUserisSpeaking(false);
      };
    
      const onSpeechEnd = () => {
        console.log("Speech ended"); 
        setAIisSpeaking(false);
        setUserisSpeaking(true);
      };

      const onError = (error) => {
          console.log("Error:", error);
      };
    
      vapi.on("call-start", onCallStart);
      vapi.on("call-end", onCallEnd);
      vapi.on("message", onMessage);
      vapi.on("speech-start", onSpeechStart);
      vapi.on("speech-end", onSpeechEnd);
      vapi.on("error", onError);
    
      return () => {
          vapi.off("call-start", onCallStart);
          vapi.off("call-end", onCallEnd);
          vapi.off("message", onMessage);
          vapi.off("speech-start", onSpeechStart);
          vapi.off("speech-end", onSpeechEnd);
          vapi.off("error", onError);
      };
    }, []);

    const fetchDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(device => device.kind === "videoinput");
        const microphones = devices.filter(device => device.kind === "audioinput");
        setAvailableCameras(cameras);
        setAvailableMicrophones(microphones);
      } catch (error) {
        console.error("Error fetching devices:", error);
      }
    }
    
    const handleCall = async() => {
        setCallStatus(CallStatus.CONNECTING);

        let formattedQuestions = '';
        if (Array.isArray(mockInterviewQuestion) && mockInterviewQuestion.length > 0) {
            formattedQuestions = mockInterviewQuestion
                .map((q) => `- ${q.question}`)
                .join("\n");
        }

        console.log(formattedQuestions)
        
        try {
            await vapi.start(interviewer, {
                variableValues: {
                    questions: formattedQuestions,
                },
            });
        } catch (error) {
            console.error("Error starting the call:", error);
        }

    }

    const handleDisconnect = () => {
        setCallStatus(CallStatus.FINISHED);
        vapi.stop();

        // TODO: Generate feedback

        router.push('/dashboard/mockInterview/interviewSession/'+interviewData?.mockID+'/feedback')
    };

    const toggleCamera = () => {
      if (isCameraOn) {
        setSelectedCamera(""); // Turn off the camera
      } else {
        const savedCamera = localStorage.getItem("selectedCamera");
        setSelectedCamera(savedCamera); // Restore last used camera
      }
    }
  
    const handleOpenSettings = () => {
      setIsSettingsOpen(true);
    }

    const handleSaveSettings = () => {
      localStorage.setItem("selectedCamera", selectedCamera);
      setIsSettingsOpen(false);
    }

    const handleCaption = () => {
      if (isCaptionOn) {
        setIsCaptionOn(false);
      } else {
        setIsCaptionOn(true);
      }
    }

    return (
    <div>
      <div className="flex justify-center items-start w-full h-full p-3 gap-2">
        <div className="grid grid-cols-2 grid-rows-[250px_auto] gap-2 w-full">
          {/* AI Interviewer Section */}
          <div className="flex flex-col bg-[#05060B]/90 rounded-2xl px-8 py-6 items-center justify-center h-[250px]">
            <div className="relative flex items-center justify-center size-[100px]">
              {/* Animated speaking effect */}
              {AIisSpeaking && (
                <div className="absolute size-4/6 animate-ping rounded-full bg-primary-200 opacity-75">
                  {/* Background Circle */}
                  <div className="absolute size-full rounded-full bg-gray-300 opacity-50"></div>
                </div> 
              )}
              {/* AI Avatar */}
              <AudioWaveform className={`z-10 text-white size-[60px] ${AIisSpeaking ? "animate-fade-pulse" : ""}`} />
            </div>
            <h2 className="text-center mt-5 text-white font-semibold">AI Interviewer</h2>
          </div>

          {/* User Section */}
          <div className="flex flex-col bg-[#05060B]/90 rounded-2xl px-8 py-6 items-center justify-center h-[250px]">
            {selectedCamera? (
              <Webcam
              videoConstraints={{ deviceId: selectedCamera ? { exact: selectedCamera } : undefined }}
              audio={false}
              mirrored={true}
              ref={webcamRef}
              style={{
                  height:180,
                  width:280
              }}
              className='mt-3'
              />
            ) : (
              <div className="relative flex items-center justify-center size-[100px]">
              {/* Animated speaking effect for user avatar */}
              {UserisSpeaking && (
                <div className="absolute size-4/6 animate-ping rounded-full bg-primary-200 opacity-75">
                  <div className="absolute size-full rounded-full bg-gray-300 opacity-50"></div>
                </div>
              )}

              {/* User Avatar */}
              {user?.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt="User Profile"
                  className={`z-10 size-[60px] rounded-full ${UserisSpeaking ? "animate-fade-pulse" : ""}`}
                />
              ) : (
                <div className={`z-10 size-[60px] rounded-full bg-gray-500 ${UserisSpeaking ? "animate-fade-pulse" : ""}`}></div> // Placeholder if no image
              )}
            </div>
            )}
            
            <h2 className={`text-center text-white font-semibold ${selectedCamera? "mt-2":"mt-5"}`}>You</h2>
          </div>
            
          {/* Transcript */}
          {isCaptionOn && (
            <>
            <div className="flex flex-col bg-[#05060B]/90 rounded-2xl px-8 py-6 items-center justify-center">
            {interviewerMessages.slice(-2).map((msg, index) => (
              <p key={index} className="text-sm text-white mb-1 animate-fadeIn">
                {msg.content}
              </p>
            ))}
            </div>
            <div className="flex flex-col bg-[#05060B]/90 rounded-2xl px-8 py-6 items-center justify-center">
            {userMessages.slice(-2).map((msg, index) => (
              <p key={index} className="text-sm text-white mb-1 animate-fadeIn">
                {msg.content}
              </p>
            ))}
            </div>
            </>
          )}
        </div>
            
        {/* Setting Bar */}
        <div className='bg-gray-400 rounded-md flex flex-col gap-1 px-1 self-center h-min justify-center w-min shrink-0'>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={toggleCamera} className='mt-1 bg-transparent shadow-none hover:bg-gray-300 w-5 group'>
                  {isCameraOn ? <VideoOff className='text-white group-hover:text-black' /> : <Video className='text-white group-hover:text-black' />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side='right' className='bg-white text-black'>
                <p>{isCameraOn ? "Turn off camera" : "Turn on camera"}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={handleOpenSettings} className='mb-1 bg-transparent shadow-none hover:bg-gray-300 w-5 group'>
                  <Settings className='text-white group-hover:text-black' />
                </Button>
              </TooltipTrigger>
              <TooltipContent side='right' className='bg-white text-black'>
                <p>Settings</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={handleCaption} className='mb-1 bg-transparent shadow-none hover:bg-gray-300 w-5 group'>
                  <CaptionsOff className='text-white group-hover:text-black' />
                </Button>
              </TooltipTrigger>
              <TooltipContent side='right' className='bg-white text-black'>
              <p>{isCaptionOn ? "Turn off captions" : "Turn on captions"}</p>
              </TooltipContent>
            </Tooltip>

          </TooltipProvider>
        </div>
            
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configure Devices</DialogTitle>
              <DialogDescription className="italic text-xs">
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

            {availableMicrophones.length > 0 && selectedMicrophone && (
              <div className="mt-3">
                <label className="font-bold">Microphone</label>
                <Select value={selectedMicrophone} onValueChange={setSelectedMicrophone} disabled={true}>
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
                <div className='p-3 border rounded-lg border-black bg-[#40E0D0] text-black flex items-start mt-3'>
                  <Info fill='#F9F6B1' className='size-[15px] mr-2'/>
                  <h2 className='text-[10px]'>** Due to system limitation, only <strong>DEFAULT</strong> microphone device is supported for <strong>Conversational Mode.</strong><br />
                  If mic configuration is necessary, you must change the system-wide default audio input through the operating system's sound settings.</h2>
                </div>
              </div>
            )}
        
            <DialogFooter className="mt-5">
              <Button onClick={handleSaveSettings}>Save</Button>
              <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
          
      <div className="w-full flex justify-center">
          {callStatus !== "ACTIVE" ? (
          <button
              onClick={handleCall}
              className="px-6 py-2 mr-10 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
              {callStatus === "CONNECTING" ? "Connecting..." : "Call"}
          </button>
          ) : (
          <button
              onClick={handleDisconnect}
              className="px-6 py-2 mr-10 bg-red-700 text-white rounded-lg hover:bg-red-800 transition"
          >
              End
          </button>
          )}
      </div>

    </div>
  )
}

export default ConversationalMode