import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'

function QuestionItemCard({question, isSelected, onSelect}) {
  
    return (
    <div className='flex justify-between items-center bg-[#F2465E]/10 border border-black rounded-xl p-6 px-7 hover:shadow-lg'>
        <div className='flex flex-col'>
            <h2 className='font-bold'>{question?.question}</h2>
            <div className='flex flex-wrap gap-2 mt-3'>
                <Badge variant="outline" className="bg-[#9C02CE] text-white">
                {question?.quesType?.charAt(0).toUpperCase() + question?.quesType?.slice(1)}
                </Badge>
                <Badge variant="outline" className="bg-[#FF8C00] text-white">
                {question?.category.replace(/\b\w/g, (char) => char.toUpperCase())}
                </Badge>
                {question?.jobRole && (
                    <Badge variant="outline" className="bg-[#40E0D0] text-white">
                    {question?.jobRole.replace(/\b\w/g, (char) => char.toUpperCase())}
                    </Badge>
                )}
            </div>
        </div>
        <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelect(checked)}
            className="ml-1 border-black data-[state=checked]:bg-black"
        />
    </div>
  )
}

export default QuestionItemCard