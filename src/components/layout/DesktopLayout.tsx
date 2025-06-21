import React from 'react';
import CoolSquare from '../core/CoolSquare';

export default function DesktopLayout() {
    return (
        <div className="h-screen  w-screen flex items-center justify-center">

            <div className='absolute top-14 right-14'>
                <CoolSquare
                    className=''
                    size={220}
                    lineThickness={1}
                    lineStyle="dashed"
                    circleSize={24}
                    rotate={30}
                />
            </div>
            <div className='absolute bottom-14 left-14'>
                <CoolSquare
                    className=''
                    size={220}
                    lineThickness={1}
                    lineStyle="dashed"
                    circleSize={24}
                    rotate={30}
                />
            </div>

            <div className="flex flex-col items-center justify-center">
                <div className="font-just-another-hand text-[96px]">A Guide For Everything</div>
                <div className="text-xl text-secondary w-1/2 text-center">Smart guides powered by AI to help families coordinate schedules, manage shift work routines, plan meals, optimize sleep patterns, and maintain work-life balance across different shift rotations.</div>
                <div className="mt-3 w-1/2 bg-primary h-44 rounded-xl">
                    <div className="flex items-between flex-col">
                        <div className="text-black mt-4 ml-4">Feeling Creative</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
