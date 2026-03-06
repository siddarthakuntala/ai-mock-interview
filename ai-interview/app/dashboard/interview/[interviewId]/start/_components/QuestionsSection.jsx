import { text } from 'drizzle-orm/gel-core'
import { Volume2 } from 'lucide-react'
import React from 'react'

function QuestionsSection({ mockInterviewQuestion, activeQuestionIndex, setActiveQuestionIndex }) {

    const textToSpeech = (text) => {
        if ('speechSynthesis' in window) {
            const speech = new SpeechSynthesisUtterance(text);
            window.speechSynthesis.speak(speech)
        }
        else {
            alert('sorry your browser does not support')
        }
    }
    return mockInterviewQuestion && (
        <div className='p-5 border rounded-lg my-10'>
            <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5'>
                {Array.isArray(mockInterviewQuestion) &&
                    mockInterviewQuestion.map((question, index) => (
                        <h2
                            key={index}
                            className={`p-2 rounded-full text-xs md:text-sm text-center cursor-pointer
  ${activeQuestionIndex === index
                                    ? 'bg-amber-900 text-white'
                                    : 'bg-secondary'
                                }`}
                        >
                            Question #{index + 1}
                        </h2>
                    ))}
            </div>

            <h2 className='my-5 text-md md:text-lg'>
                {mockInterviewQuestion?.[activeQuestionIndex]?.question}
            </h2>

            <Volume2
                className='cursor-pointer'
                onClick={() =>
                    textToSpeech(mockInterviewQuestion?.[activeQuestionIndex]?.question)
                }
            />
        </div>
    )
}

export default QuestionsSection