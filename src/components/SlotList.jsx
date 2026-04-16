import { useState } from "react";
import "./SlotList.css";

function SlotList({
  slots,
  bookings,
  procedures,
  scheduleConfig,
  availableSlots,
  selectedSlot,
  onSelectSlot,
  selectedProcedure,
  selectedProcedureSlots,
  isRescheduleMode,
  reschedulingBooking,
  onConfirmReschedule,
  onCancelReschedule,
}) {
  const [openedBooking, setOpenedBooking] = useState(null);
  const isSlotSelectionActive = Boolean(selectedProcedure);

  const appointmentDurationMinutes = selectedProcedureSlots * 5;
  const availableSlotSet = new Set(availableSlots);
  const previewStartIndex = slots.indexOf(selectedSlot);

  const previewTimes = selectedSlot
    ? Array.from({ length: selectedProcedureSlots }, (_, index) => {
        const [hours, minutes] = selectedSlot.split(":").map(Number);
        const totalMinutes = hours * 60 + minutes + index * 5;
        const previewHours = Math.floor(totalMinutes / 60);
        const previewMinutes = totalMinutes % 60;

        return `${String(previewHours).padStart(2, "0")}:${String(
          previewMinutes
        ).padStart(2, "0")}`;
      })
    : [];

  const timeToMinutes = (timeString) => {
    const [hours, minutes] = timeString.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const lunchStartMinutes = timeToMinutes(scheduleConfig.lunchStart);
  const lunchEndMinutes = timeToMinutes(scheduleConfig.lunchEnd);

  const formatMinutes = (minutesValue) => {
    const hours = Math.floor(minutesValue / 60);
    const minutes = minutesValue % 60;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}`;
  };

  const procedureColorMap = procedures.reduce((accumulator, procedure) => {
    accumulator[procedure.name] = procedure.colorClass;
    return accumulator;
  }, {});

  const occupiedSlotMap = {};

  bookings.forEach((booking) => {
    for (
      let index = booking.startSlotIndex;
      index < booking.startSlotIndex + booking.slotsUsed;
      index++
    ) {
      occupiedSlotMap[index] = booking;
    }
  });

  const schedulerRows = [];

  for (let index = 0; index < slots.length; index += 12) {
    const rowSlots = slots.slice(index, index + 12);

    if (rowSlots.length === 0) {
      continue;
    }

    const rowHourLabel = rowSlots[0];
    const rowStartMinutes = timeToMinutes(rowHourLabel);
    let sectionName = "Afternoon";

    if (rowStartMinutes < lunchStartMinutes) {
      sectionName = "Morning";
    } else if (rowStartMinutes >= lunchStartMinutes && rowStartMinutes < lunchEndMinutes) {
      sectionName = "Lunch break";
    }

    schedulerRows.push({
      sectionName,
      rowHourLabel,
      rowStartMinutes,
      rowSlots: rowSlots.map((slot, slotOffset) => ({
        slot,
        index: index + slotOffset,
      })),
    });
  }

  const schedulerSections = [
    { sectionName: "Morning", sectionLabel: "Morning" },
    { sectionName: "Lunch break", sectionLabel: "Lunch break" },
    { sectionName: "Afternoon", sectionLabel: "Afternoon" },
  ];

  return (
    <section className="slot-list-panel">
      <div className="slot-list-header">
        <div className="slot-list-heading-group">
          <h3 className="slot-list-heading">Daily scheduler</h3>
          <p className="slot-list-description">
            {selectedProcedure
              ? `${selectedProcedure} uses ${selectedProcedureSlots} slots (${appointmentDurationMinutes} min).`
              : "Select a procedure to activate slot selection."}
          </p>
        </div>

        {selectedSlot && (
          <div className="slot-list-selection-summary">
            Selected start time: <strong>{selectedSlot}</strong>
          </div>
        )}
      </div>

      {selectedSlot && (
        <div className="slot-list-preview-card">
          <div className="slot-list-preview-header">
            <div>
              <h4 className="slot-list-preview-title">Booking preview</h4>
              <p className="slot-list-preview-description">
                This appointment will reserve {selectedProcedureSlots} slots (
                {appointmentDurationMinutes} min) starting at {selectedSlot}.
              </p>
            </div>
          </div>

          <div className="slot-list-preview-grid">
            {previewTimes.map((time) => (
              <div key={time} className="slot-list-preview-time-chip">
                {time}
              </div>
            ))}
          </div>
        </div>
      )}

      {!selectedProcedure && (
        <div className="slot-list-empty-state">
          Select a procedure to activate slot selection.
        </div>
      )}

      {isRescheduleMode && reschedulingBooking && (
        <div className="slot-list-reschedule-panel">
          <div className="slot-list-reschedule-copy">
            <strong className="slot-list-reschedule-title">
              Rescheduling appointment for {reschedulingBooking.name}{" "}
              {reschedulingBooking.surname}
            </strong>

            <span className="slot-list-reschedule-text">
              Pick a new valid start time for {reschedulingBooking.procedure}.
            </span>
          </div>

          <div className="slot-list-reschedule-actions">
            <button
              type="button"
              className="slot-list-action-button slot-list-action-button-primary"
              onClick={onConfirmReschedule}
              disabled={!selectedSlot}
            >
              Confirm new slot
            </button>

            <button
              type="button"
              className="slot-list-action-button slot-list-action-button-secondary"
              onClick={onCancelReschedule}
            >
              Cancel reschedule
            </button>
          </div>
        </div>
      )}

      <div className="slot-list-scheduler-shell">
        {schedulerSections.map((section) => {
          const rowsForSection = schedulerRows.filter(
            (row) => row.sectionName === section.sectionName
          );

          if (rowsForSection.length === 0) {
            return null;
          }

          return (
            <div
              key={section.sectionName}
              className={`slot-list-scheduler-section ${
                section.sectionName === "Lunch break"
                  ? "slot-list-scheduler-section-lunch"
                  : ""
              }`}
            >
              <div className="slot-list-section-heading">
                {section.sectionLabel}
              </div>

              <div className="slot-list-hour-stack">
                {rowsForSection.map((row) => (
                  <div key={row.rowHourLabel} className="slot-list-hour-row">
                    <div className="slot-list-hour-label">{row.rowHourLabel}</div>

                    <div className="slot-list-hour-slots">
                      {row.rowSlots.map((slotData) => {
                        const booking = occupiedSlotMap[slotData.index];
                        const isOccupied = Boolean(booking);
                        const isSelectedStart = selectedSlot === slotData.slot;
                        const slotMinutes = timeToMinutes(slotData.slot);
                        const isPreviewed =
                          previewStartIndex !== -1 &&
                          slotData.index >= previewStartIndex &&
                          slotData.index <
                            previewStartIndex + selectedProcedureSlots;
                        const isLunchPreviewSlot =
                          isPreviewed &&
                          slotMinutes >= lunchStartMinutes &&
                          slotMinutes < lunchEndMinutes;
                        const isValidStart = availableSlotSet.has(slotData.slot);
                        const isClickableFree =
                          isSlotSelectionActive && !isOccupied && isValidStart;

                        let slotClassName = "slot-list-scheduler-cell";

                        if (row.sectionName === "Lunch break") {
                          slotClassName += " slot-list-scheduler-cell-lunch";
                        }

                        if (isOccupied) {
                          const bookingStart = booking.startSlotIndex;
                          const bookingEnd =
                            booking.startSlotIndex + booking.slotsUsed - 1;
                          const colorClass =
                            procedureColorMap[booking.procedure] || "";

                          slotClassName += " slot-list-scheduler-cell-occupied";

                          if (colorClass) {
                            slotClassName += ` ${colorClass}`;
                          }

                          if (slotData.index === bookingStart) {
                            slotClassName += " slot-list-scheduler-cell-range-start";
                          }

                          if (slotData.index > bookingStart && slotData.index < bookingEnd) {
                            slotClassName += " slot-list-scheduler-cell-range-middle";
                          }

                          if (slotData.index === bookingEnd) {
                            slotClassName += " slot-list-scheduler-cell-range-end";
                          }
                        } else if (isValidStart) {
                          slotClassName += " slot-list-scheduler-cell-available";
                        } else {
                          slotClassName += " slot-list-scheduler-cell-unavailable";
                        }

                        if (isPreviewed) {
                          slotClassName += " slot-list-scheduler-cell-preview";

                          if (isLunchPreviewSlot) {
                            slotClassName +=
                              " slot-list-scheduler-cell-preview-lunch";
                          }
                        }

                        if (isSelectedStart) {
                          slotClassName += " slot-list-scheduler-cell-selected-start";
                        }

                        if (isOccupied) {
                          return (
                            <button
                              key={slotData.slot}
                              type="button"
                              className={slotClassName}
                              onClick={() => setOpenedBooking(booking)}
                              aria-label={`${booking.procedure} booking at ${slotData.slot}`}
                            />
                          );
                        }

                        return (
                          <button
                            key={slotData.slot}
                            type="button"
                            className={slotClassName}
                            onClick={() => {
                              if (isClickableFree) {
                                onSelectSlot(slotData.slot);
                              }
                            }}
                            disabled={!isClickableFree}
                            aria-label={`Start slot ${slotData.slot}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {openedBooking && (
        <div
          className="slot-list-booking-overlay"
          onClick={() => setOpenedBooking(null)}
        >
          <div
            className="slot-list-booking-dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="slot-list-booking-close"
              onClick={() => setOpenedBooking(null)}
              aria-label="Close booking details"
            >
              X
            </button>

            <h4 className="slot-list-booking-title">Appointment details</h4>

            <div className="slot-list-booking-field">
              <span className="slot-list-booking-label">Name</span>
              <span>{openedBooking.name}</span>
            </div>

            <div className="slot-list-booking-field">
              <span className="slot-list-booking-label">Surname</span>
              <span>{openedBooking.surname}</span>
            </div>

            <div className="slot-list-booking-field">
              <span className="slot-list-booking-label">Procedure</span>
              <span>{openedBooking.procedure}</span>
            </div>

            <div className="slot-list-booking-field">
              <span className="slot-list-booking-label">Time range</span>
              <span>
                {openedBooking.slot} - {formatMinutes(openedBooking.endMinutes)}
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default SlotList;
