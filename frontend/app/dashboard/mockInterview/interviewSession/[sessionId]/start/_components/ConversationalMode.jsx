"use client"
import { useUser } from '@clerk/nextjs'
import React, { useEffect, useState } from 'react'
import { AudioWaveform } from 'lucide-react';
import { vapi } from "@/lib/vapi.sdk";
import { interviewer } from "@/constants";
import { cn } from "@/lib/utils";

const CallStatus = {
    INACTIVE: "INACTIVE",
    CONNECTING: "CONNECTING",
    ACTIVE: "ACTIVE",
    FINISHED: "FINISHED",
};

function ConversationalMode({mockInterviewQuestion, selectedCamera, setSelectedCamera, selectedMicrophone, setSelectedMicrophone, webcamRef, interviewData, params}) {
    const {user} = useUser()
    const [AIisSpeaking, setAIisSpeaking] = useState(false)
    const [UserisSpeaking, setUserisSpeaking] = useState(false)
    const [messages, setMessages] = useState([])
    // const [AIMessage, setAIMessage] = useState("")
    // const [userMessage, setUserMessage] = useState("")
    const [lastMessage, setLastMessage] = useState("");
    const [callStatus, setCallStatus] = useState(CallStatus.INACTIVE)

    const interviewerMessages = messages.filter((msg) => msg.role === "assistant");
    const userMessages = messages.filter((msg) => msg.role === "user");
    const lastUserMessage = [...userMessages].pop();
    const lastInterviewerMessage = [...interviewerMessages].pop();


    useEffect(() => {
      console.log("All messages:", messages);
    }, [messages]);
    
    useEffect(() => {
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
    
        const onSpeechStart = (role) => {
            console.log("speech start");
            if (role === "assistant") setAIisSpeaking(true);
            if (role === "user") setUserisSpeaking(true);
        };
    
        const onSpeechEnd = (role) => {
            console.log("speech end");
            if (role === "assistant") setAIisSpeaking(false);
            if (role === "user") setUserisSpeaking(false);
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

    useEffect(() => {
        if (messages.length > 0) {
          setLastMessage(messages[messages.length - 1].content);
        }
    
        // const handleGenerateFeedback = async (messages: SavedMessage[]) => {
        //   console.log("handleGenerateFeedback");
    
        //   const { success, feedbackId: id } = await createFeedback({
        //     interviewId: interviewId!,
        //     userId: userId!,
        //     transcript: messages,
        //     feedbackId,
        //   });
    
        //   if (success && id) {
        //     router.push(`/interview/${interviewId}/feedback`);
        //   } else {
        //     console.log("Error saving feedback");
        //     router.push("/");
        //   }
        // };
    
        // if (callStatus === CallStatus.FINISHED) {
        //     handleGenerateFeedback(messages);
        // }
    }, [messages, callStatus]);

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
    };

    return (
    <div className="my-3 flex flex-col justify-center items-center w-full h-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 w-full max-w-7xl p-5 overflow-auto">
          
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
            <h2 className="text-center mt-5 text-white font-semibold">You</h2>
          </div>
          
          {/* Transcript */}
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
        </div>

        <div className="w-full flex justify-center mt-2">
            {callStatus !== "ACTIVE" ? (
            <button
                onClick={handleCall}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
                {callStatus === "CONNECTING" ? "Connecting..." : "Call"}
            </button>
            ) : (
            <button
                onClick={handleDisconnect}
                className="px-6 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition"
            >
                End
            </button>
            )}
        </div>

      </div>
  )
}

export default ConversationalMode