import { useEffect, useState } from "react";
import "./App.css";
import DayList from "./components/DayList";
import ProcedureSelector from "./components/ProcedureSelector";
import SlotList from "./components/SlotList";
import BookingForm from "./components/BookingForm";
import BookingList from "./components/BookingList";

function App() {
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedProcedure, setSelectedProcedure] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookings, setBookings] = useState({});
  const [reschedulingBookingKey, setReschedulingBookingKey] = useState(null);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [replacementOpportunity, setReplacementOpportunity] = useState(null);

  const years = [2026, 2027, 2028, 2029];

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  // Edit these values later if you want to move the working day or lunch break.
  const scheduleConfig = {
    dayStart: "08:00",
    dayEnd: "18:00",
    lunchStart: "13:00",
    lunchEnd: "14:00",
  };

  // EDIT PROCEDURES HERE
  // slots = number of 5-minute blocks used by that procedure
  const procedures = [
    { name: "Innalbire", slots: 3, colorClass: "procedure-hard-yellow" },
    { name: "Carie", slots: 6, colorClass: "procedure-blue" },
    {
      name: "Schimbare arc aparat dentar",
      slots: 5,
      colorClass: "procedure-azure",
    },
    { name: "Pus aparat dentar", slots: 2, colorClass: "procedure-purple" },
    { name: "Frecam menta", slots: 6, colorClass: "procedure-orange" },
  ];

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const numberOfDays = getDaysInMonth(selectedYear, selectedMonth);
  const days = Array.from({ length: numberOfDays }, (_, index) => index + 1);

  const generateSlots = () => {
    const slots = [];
    let totalMinutes = timeToMinutes(scheduleConfig.dayStart);
    const endMinutes = timeToMinutes(scheduleConfig.dayEnd);
    const step = 5;

    while (totalMinutes < endMinutes) {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      const formattedTime = `${String(hours).padStart(2, "0")}:${String(
        minutes
      ).padStart(2, "0")}`;

      slots.push(formattedTime);
      totalMinutes += step;
    }

    return slots;
  };

  const timeToMinutes = (timeString) => {
    const [hours, minutes] = timeString.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const formatMinutes = (minutesValue) => {
    const hours = Math.floor(minutesValue / 60);
    const minutes = minutesValue % 60;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}`;
  };

  const getSelectedProcedureData = () => {
    return procedures.find(
      (procedure) => procedure.name === selectedProcedure
    );
  };

  const getProcedureSlotsCount = () => {
    const procedure = getSelectedProcedureData();
    return procedure ? procedure.slots : 0;
  };

  const getBookingDateTime = (booking) => {
    const bookingHours = Math.floor(booking.startMinutes / 60);
    const bookingMinutes = booking.startMinutes % 60;

    return new Date(
      booking.year,
      booking.month,
      booking.day,
      bookingHours,
      bookingMinutes,
      0,
      0
    );
  };

  const formatBookingDate = (booking) => {
    return `${months[booking.month]} ${booking.day}, ${booking.year}`;
  };

  const getCandidatePriorityGroup = (candidateBooking, freedBooking) => {
    if (candidateBooking.procedure === freedBooking.procedure) {
      return 0;
    }

    if (candidateBooking.slotsUsed <= freedBooking.slotsUsed) {
      return 1;
    }

    return 2;
  };

  const allSlots = generateSlots();

  const canBookingFitAtFreedSlot = (
    candidateBooking,
    freedBooking,
    bookingsMap = bookings,
    excludedBookingKeys = []
  ) => {
    if (freedBooking.startSlotIndex + candidateBooking.slotsUsed > allSlots.length) {
      return false;
    }

    const targetStartIndex = freedBooking.startSlotIndex;
    const targetEndIndex = targetStartIndex + candidateBooking.slotsUsed - 1;
    const excludedKeys = new Set([
      ...excludedBookingKeys,
      candidateBooking.bookingKey,
    ]);

    return Object.entries(bookingsMap).every(([bookingKey, booking]) => {
      if (excludedKeys.has(bookingKey)) {
        return true;
      }

      if (
        booking.year !== freedBooking.year ||
        booking.month !== freedBooking.month ||
        booking.day !== freedBooking.day
      ) {
        return true;
      }

      const bookingStartIndex = booking.startSlotIndex;
      const bookingEndIndex =
        booking.startSlotIndex + booking.slotsUsed - 1;

      return (
        targetEndIndex < bookingStartIndex || targetStartIndex > bookingEndIndex
      );
    });
  };

  const getReplacementCandidates = () => {
    if (!replacementOpportunity) {
      return [];
    }

    const { freedBooking, excludedBookingKeys = [], triggeredAt } =
      replacementOpportunity;
    const triggeredDateTime = new Date(triggeredAt);
    const freedDateTime = getBookingDateTime(freedBooking);

    if (freedDateTime <= triggeredDateTime) {
      return [];
    }

    const excludedKeys = new Set(excludedBookingKeys);

    return Object.entries(bookings)
      .map(([bookingKey, booking]) => ({
        ...booking,
        bookingKey,
      }))
      .filter((booking) => booking.anticipation)
      .filter((booking) => !excludedKeys.has(booking.bookingKey))
      .filter((booking) => booking.slotsUsed <= freedBooking.slotsUsed + 2)
      .filter((booking) => {
        const bookingDateTime = getBookingDateTime(booking);

        return (
          bookingDateTime > triggeredDateTime && bookingDateTime > freedDateTime
        );
      })
      .filter((booking) =>
        canBookingFitAtFreedSlot(
          booking,
          freedBooking,
          bookings,
          excludedBookingKeys
        )
      )
      .sort((firstBooking, secondBooking) => {
        const firstPriorityGroup = getCandidatePriorityGroup(
          firstBooking,
          freedBooking
        );
        const secondPriorityGroup = getCandidatePriorityGroup(
          secondBooking,
          freedBooking
        );

        if (firstPriorityGroup !== secondPriorityGroup) {
          return firstPriorityGroup - secondPriorityGroup;
        }

        const firstDurationDistance = Math.abs(
          firstBooking.slotsUsed - freedBooking.slotsUsed
        );
        const secondDurationDistance = Math.abs(
          secondBooking.slotsUsed - freedBooking.slotsUsed
        );

        if (firstPriorityGroup !== 0 && firstDurationDistance !== secondDurationDistance) {
          return firstDurationDistance - secondDurationDistance;
        }

        return getBookingDateTime(firstBooking) - getBookingDateTime(secondBooking);
      });
  };

  const reschedulingBooking =
    reschedulingBookingKey !== null ? bookings[reschedulingBookingKey] : null;

  const getProcedureForCurrentMode = () => {
    return reschedulingBooking ? reschedulingBooking.procedure : null;
  };

  const handleSelectYear = (year) => {
    setSelectedYear(Number(year));
    setSelectedDay(null);
    setSelectedProcedure(getProcedureForCurrentMode());
    setSelectedSlot(null);
  };

  const handleSelectMonth = (monthIndex) => {
    setSelectedMonth(monthIndex);
    setSelectedDay(null);
    setSelectedProcedure(getProcedureForCurrentMode());
    setSelectedSlot(null);
  };

  const handleSelectDay = (day) => {
    setSelectedDay(day);
    setSelectedProcedure(getProcedureForCurrentMode());
    setSelectedSlot(null);
  };

  const handleSelectProcedure = (procedureName) => {
    if (reschedulingBooking) {
      return;
    }

    setSelectedProcedure(procedureName);
    setSelectedSlot(null);
  };

  const bookingsForSelectedDay = Object.entries(bookings)
    .filter(
      ([, booking]) =>
        booking.year === selectedYear &&
        booking.month === selectedMonth &&
        booking.day === selectedDay
    )
    .map(([bookingKey, booking]) => ({
      ...booking,
      bookingKey,
    }));

  const getOccupiedSlotIndexes = () => {
    const occupiedIndexes = new Set();

    bookingsForSelectedDay.forEach((booking) => {
      if (booking.bookingKey === reschedulingBookingKey) {
        return;
      }

      for (
        let index = booking.startSlotIndex;
        index < booking.startSlotIndex + booking.slotsUsed;
        index++
      ) {
        occupiedIndexes.add(index);
      }
    });

    return occupiedIndexes;
  };

  const occupiedSlotIndexes = getOccupiedSlotIndexes();

  const canStartBookingAt = (startIndex, slotsNeeded) => {
    if (startIndex + slotsNeeded > allSlots.length) {
      return false;
    }

    for (let index = startIndex; index < startIndex + slotsNeeded; index++) {
      if (occupiedSlotIndexes.has(index)) {
        return false;
      }
    }

    return true;
  };

  const handleSaveBooking = (formData) => {
    const slotsNeeded = getProcedureSlotsCount();
    const startSlotIndex = allSlots.indexOf(selectedSlot);

    if (startSlotIndex === -1) {
      return;
    }

    if (!canStartBookingAt(startSlotIndex, slotsNeeded)) {
      return;
    }

    const startMinutes = timeToMinutes(selectedSlot);
    const endMinutes = startMinutes + slotsNeeded * 5;

    const bookingKey = `${selectedYear}-${selectedMonth}-${selectedDay}-${selectedSlot}`;

    setBookings((prevBookings) => ({
      ...prevBookings,
      [bookingKey]: {
        ...formData,
        anticipation:
          formData.anticipation ?? formData.availabilityForAnticipation ?? false,
        poornessAllergy:
          formData.poornessAllergy ?? formData.allergyToPoorness ?? false,
        notes: formData.notes ?? "",
        year: selectedYear,
        month: selectedMonth,
        day: selectedDay,
        slot: selectedSlot,
        procedure: selectedProcedure,
        slotsUsed: slotsNeeded,
        startSlotIndex,
        startMinutes,
        endMinutes,
      },
    }));

    setSelectedSlot(null);
  };

  const handleCancelBooking = (bookingKey) => {
    const cancelledBooking = bookings[bookingKey];

    if (!cancelledBooking) {
      return;
    }

    setBookings((prevBookings) => {
      const updatedBookings = { ...prevBookings };
      delete updatedBookings[bookingKey];
      return updatedBookings;
    });

    setReplacementOpportunity({
      triggeredAt: Date.now(),
      freedBooking: {
        ...cancelledBooking,
        bookingKey,
      },
      excludedBookingKeys: [bookingKey],
    });

    if (reschedulingBookingKey === bookingKey) {
      setReschedulingBookingKey(null);
      setSelectedSlot(null);
    }
  };

  const handleStartReschedule = (bookingKey) => {
    const bookingToReschedule = bookings[bookingKey];

    if (!bookingToReschedule) {
      return;
    }

    setReschedulingBookingKey(bookingKey);
    setSelectedYear(bookingToReschedule.year);
    setSelectedMonth(bookingToReschedule.month);
    setSelectedDay(bookingToReschedule.day);
    setSelectedProcedure(bookingToReschedule.procedure);
    setSelectedSlot(null);
  };

  const handleCancelReschedule = () => {
    setReschedulingBookingKey(null);
    setSelectedSlot(null);
  };

  const handleConfirmReschedule = () => {
    if (!reschedulingBooking || !selectedSlot) {
      return;
    }

    const freedBooking = {
      ...reschedulingBooking,
      bookingKey: reschedulingBookingKey,
    };
    const startSlotIndex = allSlots.indexOf(selectedSlot);

    if (startSlotIndex === -1) {
      return;
    }

    if (!canStartBookingAt(startSlotIndex, reschedulingBooking.slotsUsed)) {
      return;
    }

    const startMinutes = timeToMinutes(selectedSlot);
    const endMinutes = startMinutes + reschedulingBooking.slotsUsed * 5;
    const nextBookingKey = `${selectedYear}-${selectedMonth}-${selectedDay}-${selectedSlot}`;
    const didFreeOriginalSlot = nextBookingKey !== reschedulingBookingKey;

    setBookings((prevBookings) => {
      const updatedBookings = { ...prevBookings };
      const currentBooking = updatedBookings[reschedulingBookingKey];

      if (!currentBooking) {
        return prevBookings;
      }

      delete updatedBookings[reschedulingBookingKey];
      updatedBookings[nextBookingKey] = {
        ...currentBooking,
        year: selectedYear,
        month: selectedMonth,
        day: selectedDay,
        slot: selectedSlot,
        startSlotIndex,
        startMinutes,
        endMinutes,
      };

      return updatedBookings;
    });

    if (didFreeOriginalSlot) {
      setReplacementOpportunity({
        triggeredAt: Date.now(),
        freedBooking,
        excludedBookingKeys: [reschedulingBookingKey, nextBookingKey],
      });
    } else {
      setReplacementOpportunity(null);
    }

    setReschedulingBookingKey(null);
    setSelectedSlot(null);
  };

  const handleDismissReplacementSuggestions = () => {
    setReplacementOpportunity(null);
  };

  const handleMoveCandidateToFreedSlot = (candidateBookingKey) => {
    if (!replacementOpportunity) {
      return;
    }

    const { freedBooking, excludedBookingKeys = [] } = replacementOpportunity;
    let didMoveCandidate = false;

    setBookings((prevBookings) => {
      const candidateBooking = prevBookings[candidateBookingKey];

      if (!candidateBooking) {
        return prevBookings;
      }

      const candidateBookingWithKey = {
        ...candidateBooking,
        bookingKey: candidateBookingKey,
      };

      if (
        !canBookingFitAtFreedSlot(
          candidateBookingWithKey,
          freedBooking,
          prevBookings,
          excludedBookingKeys
        )
      ) {
        return prevBookings;
      }

      const nextBookingKey = `${freedBooking.year}-${freedBooking.month}-${freedBooking.day}-${freedBooking.slot}`;
      const updatedBookings = { ...prevBookings };

      delete updatedBookings[candidateBookingKey];
      updatedBookings[nextBookingKey] = {
        ...candidateBooking,
        year: freedBooking.year,
        month: freedBooking.month,
        day: freedBooking.day,
        slot: freedBooking.slot,
        startSlotIndex: freedBooking.startSlotIndex,
        startMinutes: freedBooking.startMinutes,
        endMinutes: freedBooking.startMinutes + candidateBooking.slotsUsed * 5,
      };
      didMoveCandidate = true;

      return updatedBookings;
    });

    if (didMoveCandidate) {
      setReplacementOpportunity(null);
    }
  };

  const slotsNeededForCurrentMode = reschedulingBooking
    ? reschedulingBooking.slotsUsed
    : getProcedureSlotsCount();

  const availableStartSlots = selectedProcedure
    ? allSlots.filter((slot, index) =>
        canStartBookingAt(index, slotsNeededForCurrentMode)
      )
    : [];

  const dayBookings = [...bookingsForSelectedDay].sort(
    (a, b) => a.startMinutes - b.startMinutes
  );
  const replacementCandidates = getReplacementCandidates();
  const replacementSuggestionData = replacementOpportunity
    ? {
        freedBooking: {
          ...replacementOpportunity.freedBooking,
          dateLabel: formatBookingDate(replacementOpportunity.freedBooking),
          timeLabel: `${replacementOpportunity.freedBooking.slot} - ${formatMinutes(
            replacementOpportunity.freedBooking.endMinutes
          )}`,
          durationLabel: `${
            replacementOpportunity.freedBooking.slotsUsed * 5
          } min`,
        },
        candidates: replacementCandidates.map((candidate) => ({
          ...candidate,
          dateLabel: formatBookingDate(candidate),
          timeLabel: `${candidate.slot} - ${formatMinutes(candidate.endMinutes)}`,
          durationLabel: `${candidate.slotsUsed * 5} min`,
        })),
      }
    : null;

  const formattedCurrentDateTime = currentDateTime.toLocaleString([], {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="app-container">
      <style>
        {`
          .app-header {
            display: flex;
            flex-wrap: wrap;
            align-items: flex-start;
            justify-content: space-between;
            gap: 16px;
            margin-bottom: 20px;
          }

          .app-title {
            margin: 0;
          }

          .app-current-datetime {
            padding: 10px 14px;
            border: 1px solid #d7dde5;
            border-radius: 12px;
            background: linear-gradient(180deg, #ffffff 0%, #f5f8fb 100%);
            color: #3b4754;
            font-size: 14px;
            line-height: 1.4;
            white-space: nowrap;
          }

          .app-schedule-layout {
            display: grid;
            grid-template-columns: minmax(0, 1.6fr) minmax(320px, 0.95fr);
            gap: 24px;
            align-items: start;
            margin-top: 24px;
          }

          .app-slot-column {
            min-width: 0;
          }

          .app-slot-empty-state {
            padding: 24px;
            border: 1px solid #d7dde5;
            border-radius: 16px;
            background: linear-gradient(180deg, #fafbfd 0%, #f3f6fa 100%);
            color: #3f4954;
          }

          .app-slot-empty-title {
            margin: 0 0 8px;
            font-size: 18px;
            color: #111111;
          }

          .app-slot-empty-text {
            margin: 0;
            line-height: 1.5;
          }

          .app-booking-form-panel {
            margin-top: 18px;
            padding: 22px;
            border: 1px solid #d7dde5;
            border-radius: 16px;
            background-color: #ffffff;
          }

          .app-booking-form-heading {
            margin: 0 0 16px;
            color: #111111;
          }

          @media (max-width: 980px) {
            .app-header {
              flex-direction: column;
            }

            .app-current-datetime {
              white-space: normal;
            }

            .app-schedule-layout {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>

      <div className="app-header">
        <h1 className="app-title">Customer Registration Tool</h1>
        <div className="app-current-datetime">
          Current date and time: {formattedCurrentDateTime}
        </div>
      </div>

      <DayList
        years={years}
        selectedYear={selectedYear}
        onSelectYear={handleSelectYear}
        months={months}
        selectedMonth={selectedMonth}
        onSelectMonth={handleSelectMonth}
        days={days}
        selectedDay={selectedDay}
        onSelectDay={handleSelectDay}
      />

      {selectedDay && (
        <div className="app-section">
          <h2>
            {months[selectedMonth]} {selectedDay}, {selectedYear}
          </h2>

          <ProcedureSelector
            procedures={procedures}
            selectedProcedure={selectedProcedure}
            onSelectProcedure={handleSelectProcedure}
          />

          <div className="app-schedule-layout">
            <div className="app-slot-column">
              {selectedProcedure ? (
                <>
                  <SlotList
                    slots={allSlots}
                    bookings={bookingsForSelectedDay}
                    procedures={procedures}
                    scheduleConfig={scheduleConfig}
                    availableSlots={availableStartSlots}
                    selectedSlot={selectedSlot}
                    onSelectSlot={setSelectedSlot}
                    selectedProcedure={selectedProcedure}
                    selectedProcedureSlots={slotsNeededForCurrentMode}
                    isRescheduleMode={Boolean(reschedulingBooking)}
                    reschedulingBooking={reschedulingBooking}
                    onConfirmReschedule={handleConfirmReschedule}
                    onCancelReschedule={handleCancelReschedule}
                  />

                  {selectedSlot && !reschedulingBooking && (
                    <div className="app-booking-form-panel">
                      <h3 className="app-booking-form-heading">
                        Booking for {selectedSlot} - {selectedProcedure}
                      </h3>
                      <BookingForm onSave={handleSaveBooking} />
                    </div>
                  )}
                </>
              ) : (
                <div className="app-slot-empty-state">
                  <h3 className="app-slot-empty-title">
                    Choose a procedure to see available start slots
                  </h3>
                  <p className="app-slot-empty-text">
                    The left panel shows only valid appointment start times for
                    the selected procedure, while the right panel keeps today's
                    bookings visible.
                  </p>
                </div>
              )}
            </div>

            <BookingList
              bookings={dayBookings}
              onCancelBooking={handleCancelBooking}
              onStartReschedule={handleStartReschedule}
              reschedulingBookingKey={reschedulingBookingKey}
              replacementSuggestionData={replacementSuggestionData}
              onMoveCandidateToFreedSlot={handleMoveCandidateToFreedSlot}
              onDismissReplacementSuggestions={
                handleDismissReplacementSuggestions
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
