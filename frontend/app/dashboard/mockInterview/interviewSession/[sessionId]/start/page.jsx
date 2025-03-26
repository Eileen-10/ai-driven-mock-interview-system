"use client"
import { db } from '@/utils/db'
import { InterviewPrompt } from '@/utils/schema'
import { eq } from 'drizzle-orm';
import React, { useEffect, useState, useRef } from 'react'
import QuestionSection from './_components/QuestionSection';
import { Button } from '@/components/ui/button';
import { Pause, Play } from 'lucide-react';

function StartInterview({params}) {
  
  const [elapsedTime, setElapsedTime] = useState(0);
  const [interviewData, setInterviewData]=useState();
  const [mockInterviewQuestion, setMockInterviewQuestion]=useState();
  const [selectedCamera, setSelectedCamera] = useState("");
  const [selectedMicrophone, setSelectedMicrophone] = useState("");
  const [recordingStatus, setRecordingStatus] = useState(false);
  const webcamRef = useRef(null);
  
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

  const toggleRecordingStatus = () => {
    setRecordingStatus((prev) => {
      const newRecordingState = !prev;
      localStorage.setItem("recordingEnabled", newRecordingState);
      return newRecordingState;
    });
  };
  
  return (
    <div className='px-12 py-6'>
      <div className='flex justify-between items-center gap-3'>
        <div>
          <h2 className='font-bold text-base'>{interviewData?.jobRole}</h2>
          <h2 className='text-xs pt-1 text-gray-400'>⏳ {formatTime(elapsedTime)}</h2>
          {/* <h2 className='text-xs pt-1 text-gray-400'>{interviewData?.quesType}</h2> */}
        </div>
        <div>
          <Button className='bg-[#310444] hover:bg-[#9C02CE] mr-8' onClick={toggleRecordingStatus}>
          {recordingStatus ? <Pause /> : <Play />}
          {recordingStatus ? "Stop Recording" : "Start Recording"}
          </Button>
        </div>
      </div>
      <div className='flex flex-col justify-center items-center w-full h-full'>
        <div className='flex flex-col bg-[#F2465E]/10 rounded-2xl border border-black my-3 px-8 py-5 justify-between h-auto'>
          <QuestionSection 
          mockInterviewQuestion={mockInterviewQuestion}
          selectedCamera={selectedCamera}
          selectedMicrophone={selectedMicrophone}
          webcamRef={webcamRef}
          interviewData={interviewData}
          />
        </div>
      </div>
    </div>
    
  )
}

export default StartInterview