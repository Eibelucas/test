import React from 'react';
import { Calendar, dayjsLocalizer } from 'react-big-calendar';
import dayjs from 'dayjs';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Setup the localizer by providing the moment Object
const localizer = dayjsLocalizer(dayjs);

const EventCalendar = ({ events, onSelectEvent, onSelectSlot, isTeacher }) => {
    return (
        <div style={{ height: 500 }}>
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                onSelectEvent={isTeacher ? onSelectEvent : undefined}
                onSelectSlot={isTeacher ? onSelectSlot : undefined}
                selectable={isTeacher}
            />
        </div>
    );
};

export default EventCalendar;
