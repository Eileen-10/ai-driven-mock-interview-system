"use client"
import { db } from '@/utils/db'
import { InterviewPrompt } from '@/utils/schema'
import { eq } from 'drizzle-orm';
import React, { useEffect, useState, useRef } from 'react'
import QuestionSection from './_components/QuestionSection';
import { Button } from '@/components/ui/button';
import { Info, Pause, Play } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import ConversationalMode from './_components/ConversationalMode';
import { useReactMediaRecorder } from "react-media-recorder";
import { toast } from '@/hooks/use-toast';

function StartInterview({params}) {
  
  const [elapsedTime, setElapsedTime] = useState(0);
  const [interviewData, setInterviewData]=useState();
  const [mockInterviewQuestion, setMockInterviewQuestion]=useState();
  const [selectedCamera, setSelectedCamera] = useState("");
  const [selectedMicrophone, setSelectedMicrophone] = useState("");
  const [recordingStatus, setRecordingStatus] = useState(false);
  const webcamRef = useRef(null);
  const {user} = useUser()
  const [isRecording, setIsRecording] = useState(false);
  const [hasStoppedRecording, setHasStoppedRecording] = useState(false);
  const [recordingURL, setRecordingURL] = useState("")
  
  useEffect(()=>{
    GetInterviewDetails();

    // Retrieve stored device settings
    const savedCamera = localStorage.getItem("selectedCamera");
    const savedMicrophone = localStorage.getItem("selectedMicrophone");
    const savedRecordingStatus = localStorage.getItem("recordingEnabled");

    console.log(savedCamera)
    console.log(savedMicrophone)
    console.log(savedRecordingStatus)

    setSelectedCamera(savedCamera);
    setSelectedMicrophone(savedMicrophone);
    setRecordingStatus(savedRecordingStatus === "true");

    // Apply the saved devices to media stream
    if (savedCamera || savedMicrophone) {
      startMediaStream(savedCamera, savedMicrophone);
    }

    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  },[])

  useEffect(() => {
    if (interviewData?.conversationalMode) {
      toast({
        description: (
          <div className="flex items-center gap-1 text-white text-xs">
            <Info className="h-4 w-4" />
            Click <strong>{recordingStatus ? "Start Recording, then Call" : "Call"}</strong> whenever you're ready!
          </div>
        ),
        className: "bg-[#F2465E]",
      });
    } else if (recordingStatus && !interviewData?.conversationalMode && selectedCamera) {
      toast({
        description: (
          <div className="flex flex-wrap items-center gap-1 text-white text-xs break-words">
            <Info className="h-4 w-4 shrink-0" />
            <span>
              Click <strong>Start Recording & Record Answer</strong> whenever you're ready!
            </span>
          </div>
        ),
        className: "bg-[#F2465E]",
      });
    } else if (!interviewData?.conversationalMode) {
      toast({
        description: (
          <div className="flex flex-wrap items-center gap-1 text-white text-xs break-words">
            <Info className="h-4 w-4 shrink-0" />
            <span>
              Click <strong>Record Answer</strong> whenever you're ready!
            </span>
          </div>
        ),
        className: "bg-[#F2465E]",
      });
    }
  }, [interviewData, recordingStatus, selectedCamera]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  // Get Interview Prompt Details by mockID/sessionId
  const GetInterviewDetails=async(e)=>{
    const result=await db.select()
    .from(InterviewPrompt)
    .where(eq(InterviewPrompt.mockID,params.sessionId))

    setInterviewData(result[0]);
    const jsonMockResponse=JSON.parse(result[0].jsonMockResponse);
    setMockInterviewQuestion(jsonMockResponse);
    console.log(jsonMockResponse)
  }
  
  const startMediaStream = async (cameraId, micId) => {
    try {
      // Check current permissions  
      const micPermission = await navigator.permissions.query({ name: "microphone" })
      const camPermission = await navigator.permissions.query({ name: "camera" })
      
      // Set media constraints based on permissions
      const mediaConstraints = {}
      if (cameraId && camPermission.state === "granted") {
        mediaConstraints.video = { deviceId: { exact: cameraId } };
      }
      if (micId && micPermission.state === "granted") {
        mediaConstraints.audio = { deviceId: { exact: micId } };
      }

      // If no valid constraints exist, do not request media
      if (Object.keys(mediaConstraints).length === 0) {
        console.warn("No valid media constraints. Skipping getUserMedia request.");
        return;
      }

      // Request media stream only for granted permissions
      const newStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);

      if (webcamRef.current && mediaConstraints.video) {
          webcamRef.current.video.srcObject = newStream;
      }
    } catch (error) {
        console.error("Error accessing media devices:", error);
    }
  }

  const popupRef = useRef(null);
  const toggleRecordingStatus = () => {
    if (!isRecording) {
      setIsRecording(true);
      const popup = window.open(
        `/${interviewData.mockID}/recordPrompt`,
        "ScreenRecorder",
        "width=650,height=550"
      );
      if (popup) {
        popupRef.current = popup;
        popup.onload = () => {
          sendMessageToPopout("START_RECORDING");
        };
      }
    } else {
      setIsRecording(false);
      setHasStoppedRecording(true)
      sendMessageToPopout("STOP_RECORDING");
    }
  };

  const sendMessageToPopout = (type) => {
    const interval = setInterval(() => {
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.postMessage(
          { type },
          window.location.origin
        );
        console.log(`Sending message to popout: ${type}`);
        clearInterval(interval);
      }
    }, 300); // Try every 300ms
  };

  const handleEndCall = () => {
    if (isRecording) {
      setIsRecording(false);
      setHasStoppedRecording(true);
      sendMessageToPopout("STOP_RECORDING");
    }
  };

  // Listener for recordingURL
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === "RECORDING_UPLOADED") {
        const { recordingUrl } = event.data.payload;
        console.log("Recording URL received:", recordingUrl);
        setRecordingURL(recordingUrl);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <div className='px-12 py-6'>
      <div className='flex justify-between items-center gap-3'>
        <div>
          <h2 className='font-bold text-base'>{interviewData?.jobRole}</h2>
          <h2 className='text-xs pt-1 text-gray-400'>⏳ {formatTime(elapsedTime)}</h2>
          {/* <h2 className='text-xs pt-1 text-gray-400'>{interviewData?.quesType}</h2> */}
        </div>
        <div>
          {(
            (interviewData?.conversationalMode && recordingStatus) ||
            (!interviewData?.conversationalMode && recordingStatus && selectedCamera)
          ) && (
            <Button
              className={`bg-[#310444] hover:bg-[#9C02CE] mr-8`}
              onClick={toggleRecordingStatus}
              disabled={hasStoppedRecording}
            >
              {isRecording ? (
                <>
                  <Pause className="mr-2" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Play className="mr-2" />
                  Start Recording
                </>
              )}
            </Button>
          )}
        </div>
      </div>
      
      {interviewData?.conversationalMode ? (
        // Conversational Mode
        <ConversationalMode 
        mockInterviewQuestion={mockInterviewQuestion}
        selectedCamera={selectedCamera}
        setSelectedCamera={setSelectedCamera}
        selectedMicrophone={selectedMicrophone}
        setSelectedMicrophone={setSelectedMicrophone}
        webcamRef={webcamRef}
        interviewData={interviewData}
        params={params}
        onEndCall={handleEndCall}
        recordingURL={recordingURL}
        />
      ) : (
        // Default Mode
        <div className='flex flex-col justify-center items-center w-full h-full'>
          <div className='flex flex-col bg-[#F2465E]/10 rounded-2xl border border-black my-3 px-8 py-5 justify-between h-auto'>
            <QuestionSection 
            mockInterviewQuestion={mockInterviewQuestion}
            selectedCamera={selectedCamera}
            setSelectedCamera={setSelectedCamera}
            selectedMicrophone={selectedMicrophone}
            setSelectedMicrophone={setSelectedMicrophone}
            webcamRef={webcamRef}
            interviewData={interviewData}
            params={params}
            recordingStatus={recordingStatus}
            onEndCall={handleEndCall}
            recordingURL={recordingURL}
            />
          </div>
        </div>
      )}
    </div>
    
  )
}

export default StartInterview