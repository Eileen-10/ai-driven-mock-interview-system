"use client"
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { db } from '@/utils/db'
import { UserAnswer } from '@/utils/schema'
import { useUser } from '@clerk/nextjs'
import { AssemblyAI } from 'assemblyai'
import { Disc, LoaderCircle, Mic, Settings, Video } from 'lucide-react'
import moment from 'moment'
import React, { useEffect, useRef, useState } from 'react'
import Webcam from 'react-webcam'
import RecordRTC from 'recordrtc'

const assemblyAI = new AssemblyAI({
  apiKey:process.env.NEXT_PUBLIC_ASSEMBLY_API_KEY
})

function RecordAnswerSection({selectedCamera, selectedMicrophone, webcamRef, mockInterviewQuestion, activeQuestionIndex, interviewData}) {
  const {user} = useUser()
  const [loading, setLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [audioURL, setAudioURL] = useState(null)
  const [audioBlob, setAudioBlob] = useState(null)
  const [answerTranscript, setAnswerTranscript] = useState("")  // Transcripted user answer
  const recorder = useRef(null)

  useEffect(() => {
    return () => {
      if (recorder.current) {
        recorder.current.destroy();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: selectedMicrophone } },
      });

      recorder.current = new RecordRTC(stream, {
        type: "audio",
        mimeType: "audio/webm",
        recorderType: RecordRTC.StereoAudioRecorder,
        desiredSampRate: 16000,
        numberOfAudioChannels: 1,
        timeSlice: 1000,
        audioBitsPerSecond: 128000,
      });

      recorder.current.startRecording();
      setIsRecording(true);
      setAudioURL(null);
      setAudioBlob(null);
      setAnswerTranscript("");
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    setLoading(true)
    if (recorder.current) {
      recorder.current.stopRecording(() => {
        const blob = recorder.current.getBlob();
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioURL(url);
        transcribeAudio(blob);
      });
    }
    setIsRecording(false);
  };

  const transcribeAudio = async (blob) => {
    try {
      // Convert blob to File object for upload
      const file = new File([blob], "recording.webm", { type: "audio/webm" });

      // Upload file to AssemblyAI
      const transcript = await assemblyAI.transcripts.transcribe({ audio: file });
      setAnswerTranscript(transcript.text);

      if (transcript.text.length < 10) {
        setLoading(false)
        toast({
          title: "Error",
          description: "Error while saving, your answer may be too short. Please record again."
        })
        return;
      }

    } catch (error) {
      console.error("Error transcribing audio:", error);
    }
  };

  useEffect(() => {
    if(!isRecording && answerTranscript.length >= 10) {evaluateAnswer()}
  },[answerTranscript])

  const evaluateAnswer = async() => {
    console.log(answerTranscript)
    
    // Call for LLM & similarity from FastAPI
    // To calculate Similarity Score & generate Rating + Feedback
    try {
      const response = await fetch("http://127.0.0.1:8000/evaluate-answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          interview_question: mockInterviewQuestion[activeQuestionIndex]?.question,
          suggested_answer: mockInterviewQuestion[activeQuestionIndex]?.answer,
          user_answer: answerTranscript
        })
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      const feedbackJsonResponse = await response.json();
      console.log("Evaluation Result: ", feedbackJsonResponse);
      // console.log("Similarity Score: ", feedbackJsonResponse?.similarity_score)
      // console.log("Rating: ", feedbackJsonResponse?.feedback?.[0]?.rating)
      // console.log("Feedback: ", feedbackJsonResponse?.feedback?.[0]?.feedback)
      
      // Store in database
      if(feedbackJsonResponse){
        const resp=await db.insert(UserAnswer)
        .values({
          mockIDRef:interviewData?.mockID,
          question:mockInterviewQuestion[activeQuestionIndex]?.question,
          suggestedAns:mockInterviewQuestion[activeQuestionIndex]?.answer,
          userAns:answerTranscript,
          similarityScore:feedbackJsonResponse?.similarity_score,
          rating:feedbackJsonResponse?.feedback?.[0]?.rating,
          feedback:feedbackJsonResponse?.feedback?.[0]?.feedback,
          createdBy:user?.primaryEmailAddress?.emailAddress,
          createdAt:moment().format('DD-MM-yyyy')
        })

        if(resp){
          console.log("Answer & Feedback saved successfully")
        }
        setAnswerTranscript('');
        setAudioURL(null);
        setAudioBlob(null);
        setLoading(false);
      }else{
          console.log("Error storing data");
      }
  
    } catch (error) {
      console.error("Error evaluating answer:", error);
    }
  }
  
  return (
    <div className='flex flex-row justify-center items-center relative'>
        <div className='w-full flex flex-col justify-center items-center gap-3'>
          {selectedCamera && (
            <Webcam
            // onUserMedia={()=>setWebcamEnabled(true)}
            // onUserMediaError={()=>setWebcamEnabled(false)}
            videoConstraints={{ deviceId: selectedCamera ? { exact: selectedCamera } : undefined }}
            audio={false}
            mirrored={true}
            ref={webcamRef}
            style={{
                height:250,
                width:350
            }}
            className='mt-3'
            />
          )}

          <Button className='bg-[#FF8C00] hover:bg-orange-500 hover:shadow-md' onClick={isRecording ? stopRecording : startRecording}>
            {loading ? (
              <>
              <LoaderCircle className='animate-spin'/>Saving answer..
              </>
            ) : (
              <>
              {isRecording ? <Disc /> : <Mic/>}
              {isRecording ? "Stop Recording" : "Record Answer"}
              </>
            )}
          </Button>

          {audioURL && (
            <div className="mt-4">
              <h2 className="font-bold">Recorded Audio:</h2>
              <audio controls>
                <source src={audioURL} type="audio/webm" />
                Your browser does not support the audio element.
              </audio>
            </div>
          )}

          {answerTranscript && (
            <div className="mt-4">
              <h2 className="font-bold">Transcription:</h2>
              <p className="p-2 border rounded bg-gray-100">{answerTranscript}</p>
            </div>
          )}
            
        </div>
        <div className='bg-gray-400 rounded-md flex flex-col gap-1 px-1'>
          <Button className='mt-1 bg-transparent shadow-none hover:bg-gray-300 w-5 group'><Video className='text-white group-hover:text-black' /></Button>
          <Button className='mb-1 bg-transparent shadow-none hover:bg-gray-300 w-5 group'><Settings className='text-white group-hover:text-black' /></Button>
        </div>
    </div>
    
  )
}

export default RecordAnswerSection