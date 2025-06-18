"use client"
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { db } from '@/utils/db'
import { UserAnswer } from '@/utils/schema'
import { useUser } from '@clerk/nextjs'
import { AssemblyAI } from 'assemblyai'
import { Disc, LoaderCircle, Mic, Settings, Video, VideoOff } from 'lucide-react'
import moment from 'moment'
import React, { useEffect, useRef, useState } from 'react'
import Webcam from 'react-webcam'
import RecordRTC from 'recordrtc'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@supabase/supabase-js'
import { and, eq } from 'drizzle-orm'

const assemblyAI = new AssemblyAI({
  apiKey:process.env.NEXT_PUBLIC_ASSEMBLY_API_KEY
})

// Create a Supabase client using public anon key
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_KEY
)

function RecordAnswerSection({selectedCamera, setSelectedCamera, selectedMicrophone, setSelectedMicrophone, webcamRef, mockInterviewQuestion, activeQuestionIndex, interviewData, recordingStatus, recordingURL}) {
  
  const {user} = useUser()
  const [loading, setLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [audioURL, setAudioURL] = useState(null)
  const [audioBlob, setAudioBlob] = useState(null)
  const [answerTranscript, setAnswerTranscript] = useState("")  // Transcripted user answer
  const [availableCameras, setAvailableCameras] = useState([])
  const [availableMicrophones, setAvailableMicrophones] = useState([])
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const recorder = useRef(null)   // User answer audio record
  const isCameraOn = Boolean(selectedCamera);

  useEffect(() => {
    fetchDevices();
    return () => {
      if (recorder.current) {
        recorder.current.destroy();
      }
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

  const stopRecording = async () => {
    setLoading(true)
    if (recorder.current) {
      recorder.current.stopRecording(async () => {
        const blob = recorder.current.getBlob();
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioURL(url);

        try {
          let audioUrl = null;

          if (recordingStatus) {
            audioUrl = await uploadAudioToSupabase(blob); // Upload to supabase
          }
          await transcribeAudio(blob, audioUrl);  // Pass audioUrl for UserAnswer db insert
        } catch (error) {
          console.error("Error uploading or transcribing:", error);
          setLoading(false);
        }
      });
    }
    setIsRecording(false);
  };

  const transcribeAudio = async (blob, audioUrl) => {
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

      evaluateAnswer(transcript.text, audioUrl);

    } catch (error) {
      console.error("Error transcribing audio:", error);
      setLoading(false);
    }
  };

  const evaluateAnswer = async(transcriptText, audioUrl) => {
    console.log(transcriptText)
    
    // Call for LLM & similarity from FastAPI
    // To calculate Similarity Score & generate Rating + Feedback
    try {
      const response = await fetch("https://ai-driven-mock-interview-system.onrender.com/evaluate-answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          interview_question: mockInterviewQuestion[activeQuestionIndex]?.question,
          suggested_answer: mockInterviewQuestion[activeQuestionIndex]?.answer,
          user_answer: transcriptText
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
      
      // Search for any existing answer for this question
      const existingAnswer = await db
      .select()
      .from(UserAnswer)
      .where(
        and(
          eq(UserAnswer.mockIDRef, interviewData?.mockID),
          eq(UserAnswer.question, mockInterviewQuestion[activeQuestionIndex]?.question)
        )
      );
      
      if(feedbackJsonResponse){
        // If got existing answer, update the answer
        if (existingAnswer.length > 0) {
          const resp=await db
            .update(UserAnswer)
            .set({
              userAns: transcriptText,
              similarityScore:feedbackJsonResponse?.similarity_score,
              rating:feedbackJsonResponse?.feedback?.[0]?.rating,
              feedback:feedbackJsonResponse?.feedback?.[0]?.feedback,
              audioURL:audioUrl ? audioUrl : null,
              recordingURL:recordingURL ? recordingURL : null,
              createdAt: moment().format('DD-MM-yyyy')
            })
            .where(eq(UserAnswer.id, existingAnswer[0].id));
            if(resp){
              console.log("Answer & Feedback updated successfully")
            }
        } else {
          // Else, store as new row in database
          const resp=await db.insert(UserAnswer)
            .values({
              mockIDRef:interviewData?.mockID,
              question:mockInterviewQuestion[activeQuestionIndex]?.question,
              suggestedAns:mockInterviewQuestion[activeQuestionIndex]?.answer,
              userAns:transcriptText,
              similarityScore:feedbackJsonResponse?.similarity_score,
              rating:feedbackJsonResponse?.feedback?.[0]?.rating,
              feedback:feedbackJsonResponse?.feedback?.[0]?.feedback,
              audioURL:audioUrl ? audioUrl : null,
              recordingURL:recordingURL ? recordingURL : null,
              createdBy:user?.primaryEmailAddress?.emailAddress,
              createdAt:moment().format('DD-MM-yyyy')
            })
            if(resp){
              console.log("Answer & Feedback saved successfully")
            }
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
      setLoading(false);
    }
  }

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
    localStorage.setItem("selectedMicrophone", selectedMicrophone);
    setIsSettingsOpen(false);
  }

  const uploadAudioToSupabase = async (blob) => {
    const ext = 'webm';
    const uniqueSuffix = Date.now();
    const fileName = `${uniqueSuffix}.${ext}`;
    const filePath = `audio/${user.id}/${interviewData?.mockID}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('mock-iv-sessions')
      .upload(filePath, blob, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return;
    } 

    const { data: { publicUrl } } = supabase
      .storage
      .from('mock-iv-sessions')
      .getPublicUrl(filePath);

    console.log('Public URL:', publicUrl);
    return publicUrl;
  };
  
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

          {/* {audioURL && (
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
          )} */}
            
        </div>
        <div className='bg-gray-400 rounded-md flex flex-col gap-1 px-1'>
          <Button onClick={toggleCamera} className='mt-1 bg-transparent shadow-none hover:bg-gray-300 w-5 group'>
            {isCameraOn ? <VideoOff className='text-white group-hover:text-black' /> : <Video className='text-white group-hover:text-black' />}
          </Button>
          <Button onClick={handleOpenSettings} className='mb-1 bg-transparent shadow-none hover:bg-gray-300 w-5 group'>
            <Settings className='text-white group-hover:text-black' />
          </Button>
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
    
  )
}

export default RecordAnswerSection