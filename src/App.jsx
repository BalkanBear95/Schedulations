import { useEffect, useState } from "react";
import "./App.css";
import DayList from "./components/DayList";
import ProcedureSelector from "./components/ProcedureSelector";
import SlotList from "./components/SlotList";
import BookingForm from "./components/BookingForm";
import BookingList from "./components/BookingList";
import { supabase } from "./lib/supabase";

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
  const [bookingSaveFeedback, setBookingSaveFeedback] = useState(null);
  const [isSavingBooking, setIsSavingBooking] = useState(false);
  const [recurringSummary, setRecurringSummary] = useState(null);
  const [isSavingRecurringWarnings, setIsSavingRecurringWarnings] =
    useState(false);
  const [manualConflictResolution, setManualConflictResolution] =
    useState(null);
  const [isSavingManualConflictResolution, setIsSavingManualConflictResolution] =
    useState(false);

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
    workingDays: [1, 2, 3, 4, 5],
    weekendRecurrenceStrategy: "nextFreeDay",
    maxRecurringOverlapSlots: 1,
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

  const getLastDayOfMonth = (year, month) => {
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

  const createBookingKey = (year, month, day, slot) => {
    return `${year}-${month}-${day}-${slot}`;
  };

  const formatAppointmentDate = (year, month, day) => {
    return `${String(year).padStart(4, "0")}-${String(month + 1).padStart(
      2,
      "0"
    )}-${String(day).padStart(2, "0")}`;
  };

  const formatDateToYYYYMMDD = (date) => {
    return formatAppointmentDate(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
  };

  const parseAppointmentDate = (appointmentDate) => {
    if (!appointmentDate) {
      return null;
    }

    const [yearString, monthString, dayString] = String(appointmentDate)
      .split("T")[0]
      .split("-");
    const year = Number(yearString);
    const month = Number(monthString) - 1;
    const day = Number(dayString);

    if (
      !Number.isFinite(year) ||
      !Number.isFinite(month) ||
      !Number.isFinite(day)
    ) {
      return null;
    }

    return { year, month, day };
  };

  const mapAppointmentRowToBooking = (appointmentRow) => {
    const parsedDate = parseAppointmentDate(appointmentRow.appointment_date);

    if (!parsedDate || !appointmentRow.start_time) {
      return null;
    }

    const slotsUsed = Number(appointmentRow.procedure_slots ?? 0);
    const startMinutes = timeToMinutes(appointmentRow.start_time);
    const endMinutes = appointmentRow.end_time
      ? timeToMinutes(appointmentRow.end_time)
      : startMinutes + slotsUsed * 5;
    const derivedStartSlotIndex = allSlots.indexOf(appointmentRow.start_time);
    const rawStartSlotIndex = Number(appointmentRow.start_slot_index);
    const startSlotIndex = Number.isFinite(rawStartSlotIndex)
      ? rawStartSlotIndex
      : derivedStartSlotIndex;

    if (startSlotIndex < 0) {
      return null;
    }

    return {
      id: appointmentRow.id,
      name: appointmentRow.patient_name ?? "",
      surname: appointmentRow.patient_surname ?? "",
      phone: appointmentRow.phone ?? "",
      gender: appointmentRow.gender ?? "",
      reason: appointmentRow.reason ?? "",
      anticipation: Boolean(appointmentRow.anticipation_available),
      poornessAllergy: Boolean(appointmentRow.poorness_allergy),
      notes: appointmentRow.notes ?? "",
      procedure: appointmentRow.procedure_name ?? "",
      slotsUsed,
      slot: appointmentRow.start_time,
      startMinutes,
      endMinutes,
      startSlotIndex,
      status: appointmentRow.status ?? "scheduled",
      ...parsedDate,
    };
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

  const formatOccurrenceLabel = (date, time) => {
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} at ${time}`;
  };

  const getRecurringOccurrenceKey = (occurrence) => {
    if (!occurrence) {
      return "";
    }

    return [
      occurrence.recurrenceIndex,
      occurrence.appointmentDate,
      occurrence.slot,
      occurrence.procedure,
    ].join("-");
  };

  const addWeeksToDate = (date, weeks) => {
    const nextDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
      0,
      0
    );

    nextDate.setDate(nextDate.getDate() + weeks * 7);
    return nextDate;
  };

  const addMonthsToDate = (date, monthsToAdd) => {
    const totalMonths = date.getFullYear() * 12 + date.getMonth() + monthsToAdd;
    const targetYear = Math.floor(totalMonths / 12);
    const targetMonth = totalMonths % 12;
    const targetDay = Math.min(
      date.getDate(),
      getLastDayOfMonth(targetYear, targetMonth)
    );

    return new Date(
      targetYear,
      targetMonth,
      targetDay,
      date.getHours(),
      date.getMinutes(),
      0,
      0
    );
  };

  const isWorkingDay = (date, workingDays) => {
    if (!Array.isArray(workingDays) || workingDays.length === 0) {
      return true;
    }

    // JavaScript Date.getDay(): 0 = Sunday, 1 = Monday, ... 6 = Saturday.
    return workingDays.includes(date.getDay());
  };

  const moveToNextWorkingDay = (date, workingDays) => {
    const nextDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
      0,
      0
    );

    while (!isWorkingDay(nextDate, workingDays)) {
      nextDate.setDate(nextDate.getDate() + 1);
    }

    return nextDate;
  };

  const moveToClosestWorkingDay = (date, workingDays) => {
    if (isWorkingDay(date, workingDays)) {
      return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        date.getHours(),
        date.getMinutes(),
        0,
        0
      );
    }

    for (let offset = 1; offset <= 7; offset += 1) {
      const nextDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate() + offset,
        date.getHours(),
        date.getMinutes(),
        0,
        0
      );

      if (isWorkingDay(nextDate, workingDays)) {
        return nextDate;
      }

      const previousDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate() - offset,
        date.getHours(),
        date.getMinutes(),
        0,
        0
      );

      if (isWorkingDay(previousDate, workingDays)) {
        return previousDate;
      }
    }

    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
      0,
      0
    );
  };

  const adjustWeekendRecurrenceDate = (date, currentScheduleConfig) => {
    const workingDays = currentScheduleConfig.workingDays ?? [];

    if (isWorkingDay(date, workingDays)) {
      return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        date.getHours(),
        date.getMinutes(),
        0,
        0
      );
    }

    if (currentScheduleConfig.weekendRecurrenceStrategy === "closestFreeDay") {
      return moveToClosestWorkingDay(date, workingDays);
    }

    return moveToNextWorkingDay(date, workingDays);
  };

  const generateRecurrenceSeriesId = () => {
    if (window.crypto?.randomUUID) {
      return window.crypto.randomUUID();
    }

    return `rec-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
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
  const appointmentSelectFields =
    "id, patient_name, patient_surname, phone, gender, reason, anticipation_available, poorness_allergy, notes, procedure_name, procedure_slots, appointment_date, start_time, end_time, start_slot_index, status, created_at, updated_at";

  useEffect(() => {
    let isActive = true;

    const loadAppointments = async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select(appointmentSelectFields)
        .eq("status", "scheduled")
        .order("appointment_date", { ascending: true })
        .order("start_time", { ascending: true });

      if (error) {
        console.error("Failed to load appointments from Supabase.", error);
        return;
      }

      const mappedBookings = (data ?? []).reduce((accumulator, appointmentRow) => {
        const booking = mapAppointmentRowToBooking(appointmentRow);

        if (!booking) {
          return accumulator;
        }

        const bookingKey = createBookingKey(
          booking.year,
          booking.month,
          booking.day,
          booking.slot
        );

        accumulator[bookingKey] = booking;
        return accumulator;
      }, {});

      if (!isActive) {
        return;
      }

      setBookings((previousBookings) => ({
        ...mappedBookings,
        ...previousBookings,
      }));
    };

    loadAppointments();

    return () => {
      isActive = false;
    };
  }, []);

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
    if (manualConflictResolution?.occurrence?.procedure) {
      return manualConflictResolution.occurrence.procedure;
    }

    return reschedulingBooking ? reschedulingBooking.procedure : null;
  };

  const clearManualConflictResolution = () => {
    setManualConflictResolution(null);
    setSelectedSlot(null);
  };

  const handleSelectYear = (year) => {
    const procedureForCurrentMode = reschedulingBooking
      ? reschedulingBooking.procedure
      : null;

    if (manualConflictResolution) {
      clearManualConflictResolution();
    }

    setSelectedYear(Number(year));
    setSelectedDay(null);
    setSelectedProcedure(procedureForCurrentMode);
    setSelectedSlot(null);
    setBookingSaveFeedback(null);
  };

  const handleSelectMonth = (monthIndex) => {
    const procedureForCurrentMode = reschedulingBooking
      ? reschedulingBooking.procedure
      : null;

    if (manualConflictResolution) {
      clearManualConflictResolution();
    }

    setSelectedMonth(monthIndex);
    setSelectedDay(null);
    setSelectedProcedure(procedureForCurrentMode);
    setSelectedSlot(null);
    setBookingSaveFeedback(null);
  };

  const handleSelectDay = (day) => {
    const isSwitchingAwayFromManualConflict =
      manualConflictResolution &&
      day !== manualConflictResolution.occurrence.day;
    const procedureForCurrentMode =
      isSwitchingAwayFromManualConflict || !manualConflictResolution
        ? reschedulingBooking
          ? reschedulingBooking.procedure
          : null
        : getProcedureForCurrentMode();

    if (
      manualConflictResolution &&
      day !== manualConflictResolution.occurrence.day
    ) {
      clearManualConflictResolution();
    }

    setSelectedDay(day);
    setSelectedProcedure(procedureForCurrentMode);
    setSelectedSlot(null);
    setBookingSaveFeedback(null);
  };

  const handleSelectProcedure = (procedureName) => {
    if (reschedulingBooking || manualConflictResolution) {
      return;
    }

    if (selectedProcedure === procedureName) {
      setSelectedProcedure(null);
      setSelectedSlot(null);
      setBookingSaveFeedback(null);
      return;
    }

    setSelectedProcedure(procedureName);
    setSelectedSlot(null);
    setBookingSaveFeedback(null);
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

  const canBookingFitAtExactDateTime = (
    bookingsMap,
    targetYear,
    targetMonth,
    targetDay,
    startSlotIndex,
    slotsNeeded
  ) => {
    if (startSlotIndex < 0 || startSlotIndex + slotsNeeded > allSlots.length) {
      return false;
    }

    const targetEndIndex = startSlotIndex + slotsNeeded - 1;

    return Object.values(bookingsMap).every((booking) => {
      if (
        booking.year !== targetYear ||
        booking.month !== targetMonth ||
        booking.day !== targetDay
      ) {
        return true;
      }

      const bookingStartIndex = booking.startSlotIndex;
      const bookingEndIndex = booking.startSlotIndex + booking.slotsUsed - 1;

      return (
        targetEndIndex < bookingStartIndex || startSlotIndex > bookingEndIndex
      );
    });
  };

  const normalizeBookingFormData = (formData) => {
    return {
      ...formData,
      anticipation:
        formData.anticipation ?? formData.availabilityForAnticipation ?? false,
      poornessAllergy:
        formData.poornessAllergy ?? formData.allergyToPoorness ?? false,
      notes: formData.notes ?? "",
    };
  };

  const buildAppointmentPayload = ({
    bookingData,
    appointmentDate,
    procedureName,
    procedureSlots,
    startTime,
    endTime,
    startSlotIndex,
    recurrenceData,
  }) => {
    const basePayload = {
      patient_name: bookingData.name ?? "",
      patient_surname: bookingData.surname ?? "",
      phone: bookingData.phone ?? "",
      gender: bookingData.gender ?? "",
      reason: bookingData.reason ?? "",
      anticipation_available: bookingData.anticipation,
      poorness_allergy: bookingData.poornessAllergy,
      notes: bookingData.notes,
      procedure_name: procedureName,
      procedure_slots: procedureSlots,
      appointment_date: appointmentDate,
      start_time: startTime,
      end_time: endTime,
      start_slot_index: startSlotIndex,
      status: "scheduled",
    };

    if (!recurrenceData) {
      return basePayload;
    }

    return {
      ...basePayload,
      is_recurring: true,
      recurrence_series_id: recurrenceData.seriesId,
      recurrence_interval_value: recurrenceData.intervalValue,
      recurrence_interval_unit: recurrenceData.intervalUnit,
      recurrence_index: recurrenceData.index,
    };
  };

  const createRecurringOccurrence = ({
    targetDate,
    recurrenceIndex,
    bookingData,
    recurrenceData,
    procedureName,
    procedureSlots,
    startTime,
    endTime,
    startSlotIndex,
    startMinutes,
    endMinutes,
  }) => {
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const day = targetDate.getDate();
    const appointmentDate = formatDateToYYYYMMDD(targetDate);

    return {
      recurrenceIndex,
      appointmentDate,
      year,
      month,
      day,
      slot: startTime,
      procedure: procedureName,
      slotsUsed: procedureSlots,
      startSlotIndex,
      startMinutes,
      endMinutes,
      name: bookingData.name ?? "",
      surname: bookingData.surname ?? "",
      phone: bookingData.phone ?? "",
      gender: bookingData.gender ?? "",
      reason: bookingData.reason ?? "",
      anticipation: bookingData.anticipation,
      poornessAllergy: bookingData.poornessAllergy,
      notes: bookingData.notes,
      dateLabel: `${months[month]} ${day}, ${year}`,
      timeLabel: `${startTime} - ${endTime}`,
      label: formatOccurrenceLabel(targetDate, startTime),
      overlapSlots: 0,
      overlapMinutes: 0,
      payload: buildAppointmentPayload({
        bookingData,
        appointmentDate,
        procedureName,
        procedureSlots,
        startTime,
        endTime,
        startSlotIndex,
        recurrenceData: {
          ...recurrenceData,
          index: recurrenceIndex,
        },
      }),
    };
  };

  const getOverlapSlotCountForDateAndTime = (
    bookingsMap,
    targetYear,
    targetMonth,
    targetDay,
    startSlotIndex,
    slotsNeeded
  ) => {
    if (startSlotIndex < 0 || startSlotIndex + slotsNeeded > allSlots.length) {
      return slotsNeeded;
    }

    const targetEndIndex = startSlotIndex + slotsNeeded - 1;
    const overlappingIndexes = new Set();

    Object.values(bookingsMap).forEach((booking) => {
      if (
        booking.year !== targetYear ||
        booking.month !== targetMonth ||
        booking.day !== targetDay
      ) {
        return;
      }

      const bookingStartIndex = booking.startSlotIndex;
      const bookingEndIndex = booking.startSlotIndex + booking.slotsUsed - 1;
      const overlapStartIndex = Math.max(startSlotIndex, bookingStartIndex);
      const overlapEndIndex = Math.min(targetEndIndex, bookingEndIndex);

      if (overlapStartIndex > overlapEndIndex) {
        return;
      }

      for (
        let slotIndex = overlapStartIndex;
        slotIndex <= overlapEndIndex;
        slotIndex += 1
      ) {
        overlappingIndexes.add(slotIndex);
      }
    });

    return overlappingIndexes.size;
  };

  const classifyRecurringOccurrence = (bookingsMap, occurrence) => {
    const overlapSlots = getOverlapSlotCountForDateAndTime(
      bookingsMap,
      occurrence.year,
      occurrence.month,
      occurrence.day,
      occurrence.startSlotIndex,
      occurrence.slotsUsed
    );
    const overlapMinutes = overlapSlots * 5;
    let classification = "exact";

    if (overlapSlots > scheduleConfig.maxRecurringOverlapSlots) {
      classification = "hard-conflict";
    } else if (overlapSlots > 0) {
      classification = "warning";
    }

    return {
      ...occurrence,
      overlapSlots,
      overlapMinutes,
      classification,
    };
  };

  const insertRecurringOccurrences = async (
    occurrences,
    bookingsMap,
    maxAllowedOverlapSlots = 0
  ) => {
    let workingBookings = { ...bookingsMap };
    const insertedBookingsByKey = {};
    const insertedOccurrences = [];
    const failedOccurrences = [];
    const blockedOccurrences = [];

    for (const occurrence of occurrences) {
      const classifiedOccurrence = classifyRecurringOccurrence(
        workingBookings,
        occurrence
      );

      if (classifiedOccurrence.overlapSlots > maxAllowedOverlapSlots) {
        blockedOccurrences.push(classifiedOccurrence);
        continue;
      }

      const { data, error } = await supabase
        .from("appointments")
        .insert(classifiedOccurrence.payload)
        .select(appointmentSelectFields)
        .single();

      if (error) {
        console.error(
          "Failed to save a recurring appointment to Supabase.",
          error
        );
        failedOccurrences.push({
          ...classifiedOccurrence,
          failureReason: "save-error",
        });
        continue;
      }

      const insertedBooking =
        mapAppointmentRowToBooking(data) ?? {
          id: data?.id,
          name: classifiedOccurrence.name,
          surname: classifiedOccurrence.surname,
          phone: classifiedOccurrence.phone,
          gender: classifiedOccurrence.gender,
          reason: classifiedOccurrence.reason,
          anticipation: classifiedOccurrence.anticipation,
          poornessAllergy: classifiedOccurrence.poornessAllergy,
          notes: classifiedOccurrence.notes,
          year: classifiedOccurrence.year,
          month: classifiedOccurrence.month,
          day: classifiedOccurrence.day,
          slot: classifiedOccurrence.slot,
          procedure: classifiedOccurrence.procedure,
          slotsUsed: classifiedOccurrence.slotsUsed,
          startSlotIndex: classifiedOccurrence.startSlotIndex,
          startMinutes: classifiedOccurrence.startMinutes,
          endMinutes: classifiedOccurrence.endMinutes,
          status: "scheduled",
        };
      const bookingKey = createBookingKey(
        insertedBooking.year,
        insertedBooking.month,
        insertedBooking.day,
        insertedBooking.slot
      );

      insertedBookingsByKey[bookingKey] = {
        ...insertedBooking,
      };
      workingBookings = {
        ...workingBookings,
        [bookingKey]: insertedBooking,
      };
      insertedOccurrences.push(classifiedOccurrence);
    }

    return {
      workingBookings,
      insertedBookingsByKey,
      insertedOccurrences,
      failedOccurrences,
      blockedOccurrences,
    };
  };

  const handleSaveBooking = async (formData) => {
    if (isSavingBooking) {
      return;
    }

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
    const appointmentDate = formatAppointmentDate(
      selectedYear,
      selectedMonth,
      selectedDay
    );
    const startDate = new Date(
      selectedYear,
      selectedMonth,
      selectedDay,
      Math.floor(startMinutes / 60),
      startMinutes % 60,
      0,
      0
    );
    const normalizedBookingData = normalizeBookingFormData(formData);
    const recurrenceSettings = formData.recurrence ?? { enabled: false };
    const isRecurring = Boolean(recurrenceSettings.enabled);
    const recurrenceSeriesId = isRecurring
      ? generateRecurrenceSeriesId()
      : null;
    const baseRecurrenceData = isRecurring
      ? {
          seriesId: recurrenceSeriesId,
          intervalValue: recurrenceSettings.intervalValue,
          intervalUnit: recurrenceSettings.intervalUnit,
        }
      : null;
    const appointmentPayload = buildAppointmentPayload({
      bookingData: normalizedBookingData,
      appointmentDate,
      procedureName: selectedProcedure,
      procedureSlots: slotsNeeded,
      startTime: selectedSlot,
      endTime: formatMinutes(endMinutes),
      startSlotIndex,
      recurrenceData: isRecurring
        ? {
            ...baseRecurrenceData,
            index: 0,
          }
        : null,
    });

    setIsSavingBooking(true);
    setBookingSaveFeedback(null);
    setRecurringSummary(null);

    try {
      const { data, error } = await supabase
        .from("appointments")
        .insert(appointmentPayload)
        .select(appointmentSelectFields)
        .single();

      if (error) {
        console.error("Failed to save appointment to Supabase.", error);
        setBookingSaveFeedback({
          status: "error",
          title: "Could not save the appointment.",
          message:
            "The original appointment was not created. Please try again.",
        });
        return;
      }

      const insertedBooking =
        mapAppointmentRowToBooking(data) ?? {
          id: data?.id,
          ...normalizedBookingData,
          year: selectedYear,
          month: selectedMonth,
          day: selectedDay,
          slot: selectedSlot,
          procedure: selectedProcedure,
          slotsUsed,
          startSlotIndex,
          startMinutes,
          endMinutes,
          status: "scheduled",
        };

      const insertedBookingKey = createBookingKey(
        insertedBooking.year,
        insertedBooking.month,
        insertedBooking.day,
        insertedBooking.slot
      );
      const createdBookingsByKey = {
        [insertedBookingKey]: {
          ...insertedBooking,
        },
      };
      let workingBookings = {
        ...bookings,
        [insertedBookingKey]: insertedBooking,
      };

      if (!isRecurring) {
        setBookings((prevBookings) => ({
          ...prevBookings,
          ...createdBookingsByKey,
        }));
        setBookingSaveFeedback({
          status: "success",
          title: "Appointment saved.",
          message: `Booked for ${formatOccurrenceLabel(startDate, selectedSlot)}.`,
        });
        setSelectedSlot(null);
        return;
      }

      const autoInsertedOccurrences = [];
      const warningCandidates = [];
      const hardConflicts = [];
      const failedOccurrences = [];

      for (
        let recurrenceIndex = 1;
        recurrenceIndex <= recurrenceSettings.repeatCount;
        recurrenceIndex += 1
      ) {
        const offsetValue =
          recurrenceSettings.intervalValue * recurrenceIndex;
        const rawTargetDate =
          recurrenceSettings.intervalUnit === "months"
            ? addMonthsToDate(startDate, offsetValue)
            : addWeeksToDate(startDate, offsetValue);
        const targetDate = adjustWeekendRecurrenceDate(
          rawTargetDate,
          scheduleConfig
        );
        const targetYear = targetDate.getFullYear();
        const targetMonth = targetDate.getMonth();
        const targetDay = targetDate.getDate();
        const recurringOccurrence = createRecurringOccurrence({
          targetDate,
          recurrenceIndex,
          bookingData: normalizedBookingData,
          procedureName: selectedProcedure,
          procedureSlots: slotsNeeded,
          startTime: selectedSlot,
          endTime: formatMinutes(endMinutes),
          startSlotIndex,
          startMinutes,
          endMinutes,
          recurrenceData: baseRecurrenceData,
        });
        const classifiedOccurrence = classifyRecurringOccurrence(
          workingBookings,
          recurringOccurrence
        );

        if (classifiedOccurrence.classification === "warning") {
          warningCandidates.push(classifiedOccurrence);
          continue;
        }

        if (classifiedOccurrence.classification === "hard-conflict") {
          hardConflicts.push(classifiedOccurrence);
          continue;
        }

        const {
          workingBookings: nextWorkingBookings,
          insertedBookingsByKey,
          insertedOccurrences,
          failedOccurrences: currentFailedOccurrences,
        } = await insertRecurringOccurrences(
          [classifiedOccurrence],
          workingBookings,
          0
        );

        Object.assign(createdBookingsByKey, insertedBookingsByKey);
        workingBookings = nextWorkingBookings;
        autoInsertedOccurrences.push(...insertedOccurrences);
        failedOccurrences.push(...currentFailedOccurrences);
      }

      setBookings((prevBookings) => ({
        ...prevBookings,
        ...createdBookingsByKey,
      }));
      setRecurringSummary({
        seriesId: recurrenceSeriesId,
        procedure: selectedProcedure,
        originalOccurrenceLabel: formatOccurrenceLabel(startDate, selectedSlot),
        autoInsertedOccurrences,
        confirmedWarningInsertions: [],
        manuallyResolvedOccurrences: [],
        warningCandidates,
        dismissedWarningCandidates: [],
        hardConflicts,
        failedOccurrences,
        warningActionStatus: warningCandidates.length > 0 ? "pending" : null,
      });
      setSelectedSlot(null);
    } finally {
      setIsSavingBooking(false);
    }
  };

  const handleConfirmRecurringWarnings = async () => {
    if (
      !recurringSummary ||
      recurringSummary.warningCandidates.length === 0 ||
      isSavingRecurringWarnings
    ) {
      return;
    }

    setIsSavingRecurringWarnings(true);

    try {
      const {
        insertedBookingsByKey,
        insertedOccurrences,
        failedOccurrences,
        blockedOccurrences,
      } = await insertRecurringOccurrences(
        recurringSummary.warningCandidates,
        bookings,
        scheduleConfig.maxRecurringOverlapSlots
      );

      if (Object.keys(insertedBookingsByKey).length > 0) {
        setBookings((prevBookings) => ({
          ...prevBookings,
          ...insertedBookingsByKey,
        }));
      }

      setRecurringSummary((previousSummary) => {
        if (!previousSummary) {
          return previousSummary;
        }

        return {
          ...previousSummary,
          confirmedWarningInsertions: [
            ...previousSummary.confirmedWarningInsertions,
            ...insertedOccurrences,
          ],
          warningCandidates: [],
          hardConflicts: [
            ...previousSummary.hardConflicts,
            ...blockedOccurrences,
          ],
          failedOccurrences: [
            ...previousSummary.failedOccurrences,
            ...failedOccurrences,
          ],
          warningActionStatus: "confirmed",
        };
      });
    } finally {
      setIsSavingRecurringWarnings(false);
    }
  };

  const handleDismissRecurringWarnings = () => {
    if (!recurringSummary || recurringSummary.warningCandidates.length === 0) {
      return;
    }

    setRecurringSummary((previousSummary) => {
      if (!previousSummary) {
        return previousSummary;
      }

      return {
        ...previousSummary,
        dismissedWarningCandidates: [
          ...previousSummary.dismissedWarningCandidates,
          ...previousSummary.warningCandidates,
        ],
        warningCandidates: [],
        warningActionStatus: "dismissed",
      };
    });
  };

  const startManualConflictResolution = (occurrence) => {
    if (!occurrence) {
      return;
    }

    setReschedulingBookingKey(null);
    setManualConflictResolution({
      occurrence,
      occurrenceKey: getRecurringOccurrenceKey(occurrence),
    });
    setSelectedYear(occurrence.year);
    setSelectedMonth(occurrence.month);
    setSelectedDay(occurrence.day);
    setSelectedProcedure(occurrence.procedure);
    setSelectedSlot(null);
    setBookingSaveFeedback(null);
  };

  const cancelManualConflictResolution = () => {
    clearManualConflictResolution();
    setSelectedProcedure(reschedulingBooking ? reschedulingBooking.procedure : null);
  };

  const confirmManualConflictResolution = async () => {
    if (
      !manualConflictResolution ||
      !selectedSlot ||
      isSavingManualConflictResolution
    ) {
      return;
    }

    const { occurrence, occurrenceKey } = manualConflictResolution;
    const startSlotIndex = allSlots.indexOf(selectedSlot);

    if (startSlotIndex === -1) {
      return;
    }

    if (!canStartBookingAt(startSlotIndex, occurrence.slotsUsed)) {
      return;
    }

    const startMinutes = timeToMinutes(selectedSlot);
    const endMinutes = startMinutes + occurrence.slotsUsed * 5;
    const appointmentDate = formatAppointmentDate(
      occurrence.year,
      occurrence.month,
      occurrence.day
    );
    const updatedOccurrence = {
      ...occurrence,
      appointmentDate,
      slot: selectedSlot,
      startSlotIndex,
      startMinutes,
      endMinutes,
      timeLabel: `${selectedSlot} - ${formatMinutes(endMinutes)}`,
      label: `${occurrence.dateLabel} at ${selectedSlot}`,
      payload: {
        ...occurrence.payload,
        appointment_date: appointmentDate,
        start_time: selectedSlot,
        end_time: formatMinutes(endMinutes),
        start_slot_index: startSlotIndex,
      },
    };

    setIsSavingManualConflictResolution(true);

    try {
      const {
        insertedBookingsByKey,
        insertedOccurrences,
        failedOccurrences,
        blockedOccurrences,
      } = await insertRecurringOccurrences([updatedOccurrence], bookings, 0);

      if (Object.keys(insertedBookingsByKey).length > 0) {
        setBookings((prevBookings) => ({
          ...prevBookings,
          ...insertedBookingsByKey,
        }));
      }

      setRecurringSummary((previousSummary) => {
        if (!previousSummary) {
          return previousSummary;
        }

        const remainingHardConflicts = previousSummary.hardConflicts.filter(
          (conflict) => getRecurringOccurrenceKey(conflict) !== occurrenceKey
        );

        return {
          ...previousSummary,
          manuallyResolvedOccurrences: [
            ...previousSummary.manuallyResolvedOccurrences,
            ...insertedOccurrences,
          ],
          hardConflicts: [
            ...remainingHardConflicts,
            ...blockedOccurrences,
          ],
          failedOccurrences: [
            ...previousSummary.failedOccurrences,
            ...failedOccurrences,
          ],
        };
      });

      clearManualConflictResolution();
      setSelectedProcedure(reschedulingBooking ? reschedulingBooking.procedure : null);
    } finally {
      setIsSavingManualConflictResolution(false);
    }
  };

  const handleCancelBooking = async (bookingKey) => {
    const cancelledBooking = bookings[bookingKey];

    if (!cancelledBooking) {
      return;
    }

    if (!cancelledBooking.id) {
      console.error(
        "Failed to cancel appointment in Supabase because the booking id is missing.",
        cancelledBooking
      );
      return;
    }

    const { error } = await supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", cancelledBooking.id);

    if (error) {
      console.error("Failed to cancel appointment in Supabase.", error);
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

    clearManualConflictResolution();
    setReschedulingBookingKey(bookingKey);
    setSelectedYear(bookingToReschedule.year);
    setSelectedMonth(bookingToReschedule.month);
    setSelectedDay(bookingToReschedule.day);
    setSelectedProcedure(bookingToReschedule.procedure);
    setSelectedSlot(null);
    setBookingSaveFeedback(null);
  };

  const handleCancelReschedule = () => {
    clearManualConflictResolution();
    setReschedulingBookingKey(null);
    setSelectedSlot(null);
    setBookingSaveFeedback(null);
  };

  const handleConfirmReschedule = async () => {
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
    const appointmentDate = formatAppointmentDate(
      selectedYear,
      selectedMonth,
      selectedDay
    );
    const nextBookingKey = createBookingKey(
      selectedYear,
      selectedMonth,
      selectedDay,
      selectedSlot
    );
    const didFreeOriginalSlot = nextBookingKey !== reschedulingBookingKey;

    if (!reschedulingBooking.id) {
      console.error(
        "Failed to reschedule appointment in Supabase because the booking id is missing.",
        reschedulingBooking
      );
      return;
    }

    clearManualConflictResolution();
    const { error } = await supabase
      .from("appointments")
      .update({
        appointment_date: appointmentDate,
        start_time: selectedSlot,
        end_time: formatMinutes(endMinutes),
        start_slot_index: startSlotIndex,
      })
      .eq("id", reschedulingBooking.id);

    if (error) {
      console.error("Failed to reschedule appointment in Supabase.", error);
      return;
    }

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
    setBookingSaveFeedback(null);
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

      const nextBookingKey = createBookingKey(
        freedBooking.year,
        freedBooking.month,
        freedBooking.day,
        freedBooking.slot
      );
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

  const handleSelectSlot = (slot) => {
    setSelectedSlot(slot);
    setBookingSaveFeedback(null);
  };

  const getOverlappedSlotIndexes = (bookingsMap, occurrence) => {
    if (!occurrence) {
      return [];
    }

    const targetStartIndex = occurrence.startSlotIndex;
    const targetEndIndex = occurrence.startSlotIndex + occurrence.slotsUsed - 1;
    const overlappedIndexes = new Set();

    Object.values(bookingsMap).forEach((booking) => {
      if (
        booking.year !== occurrence.year ||
        booking.month !== occurrence.month ||
        booking.day !== occurrence.day
      ) {
        return;
      }

      const bookingStartIndex = booking.startSlotIndex;
      const bookingEndIndex = booking.startSlotIndex + booking.slotsUsed - 1;
      const overlapStartIndex = Math.max(targetStartIndex, bookingStartIndex);
      const overlapEndIndex = Math.min(targetEndIndex, bookingEndIndex);

      if (overlapStartIndex > overlapEndIndex) {
        return;
      }

      for (
        let slotIndex = overlapStartIndex;
        slotIndex <= overlapEndIndex;
        slotIndex += 1
      ) {
        overlappedIndexes.add(slotIndex);
      }
    });

    return [...overlappedIndexes];
  };

  const slotsNeededForCurrentMode = reschedulingBooking
    ? reschedulingBooking.slotsUsed
    : manualConflictResolution
    ? manualConflictResolution.occurrence.slotsUsed
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
  const totalInsertedRecurringOccurrences = recurringSummary
    ? recurringSummary.autoInsertedOccurrences.length +
      recurringSummary.confirmedWarningInsertions.length +
      recurringSummary.manuallyResolvedOccurrences.length
    : 0;
  const activeConflictHighlightedSlotIndexes = manualConflictResolution
    ? getOverlappedSlotIndexes(bookings, manualConflictResolution.occurrence)
    : [];

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

          .app-booking-feedback-panel {
            margin-top: 18px;
            padding: 18px 20px;
            border: 1px solid #d7dde5;
            border-radius: 16px;
            background: linear-gradient(180deg, #ffffff 0%, #f7fafc 100%);
          }

          .app-booking-feedback-panel-success {
            border-color: #b7d6bf;
            background: linear-gradient(180deg, #f7fff9 0%, #eef8f1 100%);
          }

          .app-booking-feedback-panel-error {
            border-color: #e5c0c0;
            background: linear-gradient(180deg, #fff8f8 0%, #fceeee 100%);
          }

          .app-booking-feedback-title {
            margin: 0 0 8px;
            color: #111111;
          }

          .app-booking-feedback-text {
            margin: 0;
            color: #334155;
            line-height: 1.5;
          }

          .app-booking-feedback-section {
            margin-top: 14px;
          }

          .app-booking-feedback-section-title {
            margin: 0 0 8px;
            font-size: 14px;
            font-weight: 700;
            color: #1f2937;
          }

          .app-booking-feedback-list {
            margin: 0;
            padding-left: 20px;
            color: #334155;
          }

          .app-booking-feedback-list li + li {
            margin-top: 4px;
          }

          .app-booking-feedback-empty {
            margin: 0;
            color: #526171;
            line-height: 1.5;
          }

          .app-recurring-summary-panel {
            margin-top: 18px;
            padding: 20px;
            border: 1px solid #d7dde5;
            border-radius: 16px;
            background: linear-gradient(180deg, #ffffff 0%, #f6f9fc 100%);
          }

          .app-recurring-summary-header {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            gap: 14px;
            margin-bottom: 16px;
          }

          .app-recurring-summary-title {
            margin: 0 0 6px;
            color: #111111;
          }

          .app-recurring-summary-text {
            margin: 0;
            color: #415063;
            line-height: 1.5;
          }

          .app-recurring-summary-metrics {
            display: grid;
            grid-template-columns: repeat(3, minmax(120px, 1fr));
            gap: 12px;
            margin-bottom: 16px;
          }

          .app-recurring-summary-metric {
            padding: 12px 14px;
            border: 1px solid #d8e0e8;
            border-radius: 14px;
            background-color: #ffffff;
          }

          .app-recurring-summary-metric-label {
            display: block;
            margin-bottom: 6px;
            font-size: 13px;
            color: #526171;
          }

          .app-recurring-summary-metric-value {
            font-size: 22px;
            font-weight: 700;
            color: #111111;
          }

          .app-recurring-summary-section + .app-recurring-summary-section {
            margin-top: 16px;
          }

          .app-recurring-summary-section-title {
            margin: 0 0 8px;
            font-size: 15px;
            color: #111111;
          }

          .app-recurring-summary-section-text {
            margin: 0;
            color: #526171;
            line-height: 1.5;
          }

          .app-recurring-summary-list {
            display: grid;
            gap: 10px;
          }

          .app-recurring-summary-card {
            padding: 12px 14px;
            border: 1px solid #d8e0e8;
            border-radius: 14px;
            background-color: #ffffff;
          }

          .app-recurring-summary-card-warning {
            border-color: #e6c98a;
            background: linear-gradient(180deg, #fffdf6 0%, #fff7e8 100%);
          }

          .app-recurring-summary-card-conflict {
            border-color: #e4b3b3;
            background: linear-gradient(180deg, #fff9f9 0%, #fff0f0 100%);
          }

          .app-recurring-summary-card-title {
            margin: 0 0 6px;
            font-weight: 700;
            color: #111111;
          }

          .app-recurring-summary-card-meta {
            margin: 0;
            color: #526171;
            line-height: 1.5;
          }

          .app-recurring-summary-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 12px;
          }

          .app-recurring-summary-button {
            padding: 10px 14px;
            border-radius: 10px;
            cursor: pointer;
            transition: background-color 0.2s ease, border-color 0.2s ease;
          }

          .app-recurring-summary-button-primary {
            border: 1px solid #7aa7d9;
            background-color: #7aa7d9;
            color: #ffffff;
          }

          .app-recurring-summary-button-primary:hover {
            background-color: #6998cb;
          }

          .app-recurring-summary-button-secondary {
            border: 1px solid #cfd6de;
            background-color: #ffffff;
            color: #111111;
          }

          .app-recurring-summary-button-secondary:hover {
            background-color: #f6f8fb;
          }

          .app-recurring-summary-button:disabled {
            opacity: 0.7;
            cursor: not-allowed;
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

            .app-recurring-summary-metrics {
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
              <SlotList
                slots={allSlots}
                bookings={bookingsForSelectedDay}
                procedures={procedures}
                scheduleConfig={scheduleConfig}
                availableSlots={availableStartSlots}
                selectedSlot={selectedSlot}
                onSelectSlot={handleSelectSlot}
                selectedProcedure={selectedProcedure}
                selectedProcedureSlots={slotsNeededForCurrentMode}
                isRescheduleMode={Boolean(reschedulingBooking)}
                reschedulingBooking={reschedulingBooking}
                onConfirmReschedule={handleConfirmReschedule}
                onCancelReschedule={handleCancelReschedule}
                manualConflictResolution={manualConflictResolution}
                conflictHighlightedSlotIndexes={activeConflictHighlightedSlotIndexes}
                onConfirmManualConflictResolution={
                  confirmManualConflictResolution
                }
                onCancelManualConflictResolution={cancelManualConflictResolution}
                isSavingManualConflictResolution={
                  isSavingManualConflictResolution
                }
              />

              {selectedProcedure &&
                selectedSlot &&
                !reschedulingBooking &&
                !manualConflictResolution && (
                <div className="app-booking-form-panel">
                  <h3 className="app-booking-form-heading">
                    Booking for {selectedSlot} - {selectedProcedure}
                  </h3>
                  <BookingForm
                    onSave={handleSaveBooking}
                    isSaving={isSavingBooking}
                  />
                </div>
              )}

              {bookingSaveFeedback && (
                <div
                  className={`app-booking-feedback-panel ${
                    bookingSaveFeedback.status === "error"
                      ? "app-booking-feedback-panel-error"
                      : "app-booking-feedback-panel-success"
                  }`}
                >
                  <h3 className="app-booking-feedback-title">
                    {bookingSaveFeedback.title}
                  </h3>
                  <p className="app-booking-feedback-text">
                    {bookingSaveFeedback.message}
                  </p>

                  {bookingSaveFeedback.createdFutureOccurrences && (
                    <div className="app-booking-feedback-section">
                      <h4 className="app-booking-feedback-section-title">
                        Future appointments created (
                        {bookingSaveFeedback.createdFutureOccurrences.length})
                      </h4>

                      {bookingSaveFeedback.createdFutureOccurrences.length > 0 ? (
                        <ul className="app-booking-feedback-list">
                          {bookingSaveFeedback.createdFutureOccurrences.map(
                            (occurrenceLabel) => (
                              <li key={`created-${occurrenceLabel}`}>
                                {occurrenceLabel}
                              </li>
                            )
                          )}
                        </ul>
                      ) : (
                        <p className="app-booking-feedback-empty">
                          No future appointments were created.
                        </p>
                      )}
                    </div>
                  )}

                  {bookingSaveFeedback.conflictedFutureOccurrences && (
                    <div className="app-booking-feedback-section">
                      <h4 className="app-booking-feedback-section-title">
                        Future appointments skipped because the exact slot was occupied (
                        {bookingSaveFeedback.conflictedFutureOccurrences.length})
                      </h4>

                      {bookingSaveFeedback.conflictedFutureOccurrences.length > 0 ? (
                        <ul className="app-booking-feedback-list">
                          {bookingSaveFeedback.conflictedFutureOccurrences.map(
                            (occurrenceLabel) => (
                              <li key={`conflict-${occurrenceLabel}`}>
                                {occurrenceLabel}
                              </li>
                            )
                          )}
                        </ul>
                      ) : (
                        <p className="app-booking-feedback-empty">
                          No occupied-slot conflicts were found.
                        </p>
                      )}
                    </div>
                  )}

                  {bookingSaveFeedback.failedFutureOccurrences &&
                    bookingSaveFeedback.failedFutureOccurrences.length > 0 && (
                      <div className="app-booking-feedback-section">
                        <h4 className="app-booking-feedback-section-title">
                          Future appointments that could not be saved (
                          {bookingSaveFeedback.failedFutureOccurrences.length})
                        </h4>
                        <ul className="app-booking-feedback-list">
                          {bookingSaveFeedback.failedFutureOccurrences.map(
                            (occurrenceLabel) => (
                              <li key={`failed-${occurrenceLabel}`}>
                                {occurrenceLabel}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                </div>
              )}

              {recurringSummary && (
                <div className="app-recurring-summary-panel">
                  <div className="app-recurring-summary-header">
                    <div>
                      <h3 className="app-recurring-summary-title">
                        Recurrence summary
                      </h3>
                      <p className="app-recurring-summary-text">
                        Original appointment:{" "}
                        {recurringSummary.originalOccurrenceLabel}
                      </p>
                    </div>
                    <div className="app-recurring-summary-text">
                      Procedure: {recurringSummary.procedure}
                    </div>
                  </div>

                  <div className="app-recurring-summary-metrics">
                    <div className="app-recurring-summary-metric">
                      <span className="app-recurring-summary-metric-label">
                        Inserted
                      </span>
                      <span className="app-recurring-summary-metric-value">
                        {totalInsertedRecurringOccurrences}
                      </span>
                    </div>

                    <div className="app-recurring-summary-metric">
                      <span className="app-recurring-summary-metric-label">
                        Warning candidates
                      </span>
                      <span className="app-recurring-summary-metric-value">
                        {recurringSummary.warningCandidates.length}
                      </span>
                    </div>

                    <div className="app-recurring-summary-metric">
                      <span className="app-recurring-summary-metric-label">
                        Hard conflicts
                      </span>
                      <span className="app-recurring-summary-metric-value">
                        {recurringSummary.hardConflicts.length}
                      </span>
                    </div>
                  </div>

                  <div className="app-recurring-summary-section">
                    <h4 className="app-recurring-summary-section-title">
                      Future appointments inserted automatically (
                      {recurringSummary.autoInsertedOccurrences.length})
                    </h4>
                    {recurringSummary.autoInsertedOccurrences.length > 0 ? (
                      <div className="app-recurring-summary-list">
                        {recurringSummary.autoInsertedOccurrences.map(
                          (occurrence) => (
                            <div
                              key={`auto-${occurrence.recurrenceIndex}-${occurrence.label}`}
                              className="app-recurring-summary-card"
                            >
                              <p className="app-recurring-summary-card-title">
                                {occurrence.label}
                              </p>
                              <p className="app-recurring-summary-card-meta">
                                {occurrence.procedure} at {occurrence.timeLabel}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="app-recurring-summary-section-text">
                        No future appointments were inserted automatically.
                      </p>
                    )}
                  </div>

                  {recurringSummary.confirmedWarningInsertions.length > 0 && (
                    <div className="app-recurring-summary-section">
                      <h4 className="app-recurring-summary-section-title">
                        Warning candidates inserted after confirmation (
                        {recurringSummary.confirmedWarningInsertions.length})
                      </h4>
                      <div className="app-recurring-summary-list">
                        {recurringSummary.confirmedWarningInsertions.map(
                          (occurrence) => (
                            <div
                              key={`confirmed-${occurrence.recurrenceIndex}-${occurrence.label}`}
                              className="app-recurring-summary-card"
                            >
                              <p className="app-recurring-summary-card-title">
                                {occurrence.label}
                              </p>
                              <p className="app-recurring-summary-card-meta">
                                {occurrence.procedure} at {occurrence.timeLabel}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {recurringSummary.manuallyResolvedOccurrences.length > 0 && (
                    <div className="app-recurring-summary-section">
                      <h4 className="app-recurring-summary-section-title">
                        Hard conflicts resolved manually (
                        {recurringSummary.manuallyResolvedOccurrences.length})
                      </h4>
                      <div className="app-recurring-summary-list">
                        {recurringSummary.manuallyResolvedOccurrences.map(
                          (occurrence) => (
                            <div
                              key={`manual-${occurrence.recurrenceIndex}-${occurrence.label}`}
                              className="app-recurring-summary-card"
                            >
                              <p className="app-recurring-summary-card-title">
                                {occurrence.label}
                              </p>
                              <p className="app-recurring-summary-card-meta">
                                {occurrence.procedure} at {occurrence.timeLabel}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  <div className="app-recurring-summary-section">
                    <h4 className="app-recurring-summary-section-title">
                      Warning candidates waiting for confirmation (
                      {recurringSummary.warningCandidates.length})
                    </h4>

                    {recurringSummary.warningCandidates.length > 0 ? (
                      <>
                        <div className="app-recurring-summary-list">
                          {recurringSummary.warningCandidates.map((occurrence) => (
                            <div
                              key={`warning-${occurrence.recurrenceIndex}-${occurrence.label}`}
                              className="app-recurring-summary-card app-recurring-summary-card-warning"
                            >
                              <p className="app-recurring-summary-card-title">
                                {occurrence.dateLabel} at {occurrence.slot}
                              </p>
                              <p className="app-recurring-summary-card-meta">
                                {occurrence.procedure}
                              </p>
                              <p className="app-recurring-summary-card-meta">
                                Overlap: {occurrence.overlapSlots} slot
                                {occurrence.overlapSlots === 1 ? "" : "s"} (
                                {occurrence.overlapMinutes} min)
                              </p>
                            </div>
                          ))}
                        </div>

                        <div className="app-recurring-summary-actions">
                          <button
                            type="button"
                            className="app-recurring-summary-button app-recurring-summary-button-primary"
                            onClick={handleConfirmRecurringWarnings}
                            disabled={isSavingRecurringWarnings}
                          >
                            {isSavingRecurringWarnings
                              ? "Confirming..."
                              : "Insert all warning candidates"}
                          </button>
                          <button
                            type="button"
                            className="app-recurring-summary-button app-recurring-summary-button-secondary"
                            onClick={handleDismissRecurringWarnings}
                            disabled={isSavingRecurringWarnings}
                          >
                            Dismiss warning candidates
                          </button>
                        </div>
                      </>
                    ) : (
                      <p className="app-recurring-summary-section-text">
                        {recurringSummary.warningActionStatus === "dismissed"
                          ? "Warning candidates were dismissed and not inserted."
                          : recurringSummary.warningActionStatus === "confirmed"
                          ? "All warning candidates have been processed."
                          : "No warning candidates were found."}
                      </p>
                    )}
                  </div>

                  {recurringSummary.dismissedWarningCandidates.length > 0 && (
                    <div className="app-recurring-summary-section">
                      <h4 className="app-recurring-summary-section-title">
                        Warning candidates not inserted (
                        {recurringSummary.dismissedWarningCandidates.length})
                      </h4>
                      <div className="app-recurring-summary-list">
                        {recurringSummary.dismissedWarningCandidates.map(
                          (occurrence) => (
                            <div
                              key={`dismissed-${occurrence.recurrenceIndex}-${occurrence.label}`}
                              className="app-recurring-summary-card"
                            >
                              <p className="app-recurring-summary-card-title">
                                {occurrence.dateLabel} at {occurrence.slot}
                              </p>
                              <p className="app-recurring-summary-card-meta">
                                {occurrence.procedure}
                              </p>
                              <p className="app-recurring-summary-card-meta">
                                Overlap kept at {occurrence.overlapSlots} slot
                                {occurrence.overlapSlots === 1 ? "" : "s"} (
                                {occurrence.overlapMinutes} min)
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  <div className="app-recurring-summary-section">
                    <h4 className="app-recurring-summary-section-title">
                      Hard conflicts ({recurringSummary.hardConflicts.length})
                    </h4>
                    {recurringSummary.hardConflicts.length > 0 ? (
                      <div className="app-recurring-summary-list">
                        {recurringSummary.hardConflicts.map((occurrence) => (
                          <div
                            key={`conflict-${occurrence.recurrenceIndex}-${occurrence.label}`}
                            className="app-recurring-summary-card app-recurring-summary-card-conflict"
                          >
                            <p className="app-recurring-summary-card-title">
                              {occurrence.dateLabel} at {occurrence.slot}
                            </p>
                            <p className="app-recurring-summary-card-meta">
                              {occurrence.procedure}
                            </p>
                            <p className="app-recurring-summary-card-meta">
                              Overlap: {occurrence.overlapSlots} slot
                              {occurrence.overlapSlots === 1 ? "" : "s"} (
                              {occurrence.overlapMinutes} min)
                            </p>
                            <div className="app-recurring-summary-actions">
                              <button
                                type="button"
                                className="app-recurring-summary-button app-recurring-summary-button-primary"
                                onClick={() =>
                                  startManualConflictResolution(occurrence)
                                }
                                disabled={
                                  isSavingManualConflictResolution ||
                                  (manualConflictResolution &&
                                    getRecurringOccurrenceKey(occurrence) ===
                                      manualConflictResolution.occurrenceKey)
                                }
                              >
                                {manualConflictResolution &&
                                getRecurringOccurrenceKey(occurrence) ===
                                  manualConflictResolution.occurrenceKey
                                  ? "Resolving..."
                                  : "Resolve manually"}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="app-recurring-summary-section-text">
                        No hard conflicts were found.
                      </p>
                    )}
                  </div>

                  {recurringSummary.failedOccurrences.length > 0 && (
                    <div className="app-recurring-summary-section">
                      <h4 className="app-recurring-summary-section-title">
                        Could not be saved ({recurringSummary.failedOccurrences.length})
                      </h4>
                      <div className="app-recurring-summary-list">
                        {recurringSummary.failedOccurrences.map((occurrence) => (
                          <div
                            key={`failed-${occurrence.recurrenceIndex}-${occurrence.label}`}
                            className="app-recurring-summary-card app-recurring-summary-card-conflict"
                          >
                            <p className="app-recurring-summary-card-title">
                              {occurrence.label}
                            </p>
                            <p className="app-recurring-summary-card-meta">
                              The appointment was not inserted because saving it failed.
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
