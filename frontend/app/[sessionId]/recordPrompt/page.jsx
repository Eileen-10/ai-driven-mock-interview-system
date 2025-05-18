"use client";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { useParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_KEY
)

function RecordPrompt() {
  const {user} = useUser()
  const params = useParams();
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [mediaBlobUrl, setMediaBlobUrl] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [hasStartedRecording, setHasStartedRecording] = useState(false);
  const [error, setError] = useState(null);
  const sessionId = params.sessionId;

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;

      const { type } = event.data;
      
      if (type === "STOP_RECORDING") {
        console.log("Received stop recording from main tab");
        stopCustomRecording();
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [mediaRecorder]);

  const startCustomRecording = async () => {
    try {
      setError(null);

      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
        // selfBrowserSurface: "include", // Chrome-specific
      });

      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const audioContext = new AudioContext();
      const destination = audioContext.createMediaStreamDestination();

      const systemSource = audioContext.createMediaStreamSource(displayStream);
      const micSource = audioContext.createMediaStreamSource(micStream);

      systemSource.connect(destination);
      micSource.connect(destination);

      const combinedStream = new MediaStream([
        ...displayStream.getVideoTracks(),
        ...destination.stream.getAudioTracks(),
      ]);

      const recorder = new MediaRecorder(combinedStream);

      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setMediaBlobUrl(url);
        setRecordedChunks(chunks);
        setIsRecording(false);

        uploadRecordingToSupabase(blob);
      };

      setMediaRecorder(recorder);

      recorder.start();
      setIsRecording(true);
      setHasStartedRecording(true);
    } catch (err) {
      console.error("Recording error:", err);
      setError("Failed to start recording. Please check permissions.");
    }
  };

  const stopCustomRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const uploadRecordingToSupabase = async (blob) => {
    console.log("uploadRecordingToSupabase called");
    
    if (!blob || !user || !sessionId) {
      console.warn("Missing data:", { blob, user, sessionId });
      return;
    }

    const ext = 'webm';
    const uniqueSuffix = Date.now();
    const fileName = `${uniqueSuffix}.${ext}`;
    const filePath = `recordings/${user.id}/${sessionId}/${fileName}`;

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

    console.log('Recording uploaded to:', publicUrl);

    // Send recording URL back to main tab
    if (window.opener && publicUrl) {
      window.opener.postMessage(
        {
          type: "RECORDING_UPLOADED",
          payload: {
            recordingUrl: publicUrl,
            sessionId,  // Optional, if needed for matching
          }
        },
        window.origin
      );
    }

    return publicUrl;
  };

  return (
    <div className="p-6 font-sans text-sm text-white text-center">
      <h2 className="font-bold text-xl mb-6">🔴 Session Recording</h2>
      {!mediaBlobUrl && (
        <h2 className="text-base mb-5">Make sure the correct tab is selected &<br/>'Also share tab audio' is enabled.</h2>
      )}

      {!hasStartedRecording && !mediaBlobUrl && (
        <Button
          onClick={startCustomRecording}
          className="mt-2"
        >
          Select Tab
        </Button>
      )}

      {hasStartedRecording && !mediaBlobUrl && (
        <Button disabled className="mt-2 bg-gray-500 cursor-not-allowed">
          📹 Recording started...
        </Button>
      )}

      {mediaBlobUrl && (
        <div className="mt-10 text-green-400 space-y-2">
          <p className="text-base font-semibold">✅ Recording saved successfully</p>
          <p>You may close this tab now.</p>
        </div>

        // <div className="mt-4">
        //   <h3 className="font-semibold mb-2">Recording Complete:</h3>
        //   <video
        //     src={mediaBlobUrl}
        //     controls
        //     autoPlay
        //     className="max-w-full rounded shadow"
        //   />
        // </div>
      )}

      {error && <p className="text-red-600 mt-4">{error}</p>}
    </div>
  );
}

export default RecordPrompt;