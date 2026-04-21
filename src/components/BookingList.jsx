import { useState } from "react";
import "./BookingList.css";

function BookingList({
  bookings,
  onCancelBooking,
  onStartReschedule,
  reschedulingBookingKey,
  replacementSuggestionData,
  onMoveCandidateToFreedSlot,
  onDismissReplacementSuggestions,
}) {
  const [expandedBookingKeys, setExpandedBookingKeys] = useState({});

  const toggleBookingExpansion = (bookingKey) => {
    setExpandedBookingKeys((previousState) => ({
      ...previousState,
      [bookingKey]: !previousState[bookingKey],
    }));
  };

  const formatTimeDisplay = (timeValue) => {
    if (!timeValue) {
      return "";
    }

    const [hours = "00", minutes = "00"] = String(timeValue).split(":");
    return `${hours}:${minutes}`;
  };

  return (
    <aside className="booking-panel">
      <div className="booking-panel-header">
        <div>
          <h2 className="booking-panel-title">Booked appointments</h2>
          <p className="booking-panel-description">
            Appointments scheduled for the selected day.
          </p>
        </div>
        <div className="booking-panel-count">
          {bookings.length} {bookings.length === 1 ? "booking" : "bookings"}
        </div>
      </div>

      {replacementSuggestionData && (
        <section className="booking-panel-suggestions">
          <div className="booking-panel-suggestions-header">
            <div>
              <h3 className="booking-panel-suggestions-title">
                Possible patients to anticipate
              </h3>
              <p className="booking-panel-suggestions-description">
                Freed slot: {replacementSuggestionData.freedBooking.dateLabel},{" "}
                {replacementSuggestionData.freedBooking.timeLabel}
              </p>
            </div>

            <button
              type="button"
              className="booking-panel-dismiss-button"
              onClick={onDismissReplacementSuggestions}
            >
              Dismiss
            </button>
          </div>

          <div className="booking-panel-suggestions-meta">
            Original duration: {replacementSuggestionData.freedBooking.durationLabel}
          </div>

          {replacementSuggestionData.candidates.length === 0 ? (
            <div className="booking-panel-suggestions-empty">
              No eligible future patients are available for this freed slot right
              now.
            </div>
          ) : (
            <div className="booking-panel-suggestions-list">
              {replacementSuggestionData.candidates.map((candidate) => (
                <article
                  key={candidate.bookingKey}
                  className="booking-panel-suggestion-card"
                >
                  <div className="booking-panel-suggestion-current">
                    Current appointment: {candidate.dateLabel}, {candidate.timeLabel}
                  </div>

                  <div className="booking-panel-details">
                    <div className="booking-panel-detail-row">
                      <span className="booking-panel-detail-label">Name</span>
                      <span className="booking-panel-detail-value">
                        {candidate.name}
                      </span>
                    </div>

                    <div className="booking-panel-detail-row">
                      <span className="booking-panel-detail-label">Surname</span>
                      <span className="booking-panel-detail-value">
                        {candidate.surname}
                      </span>
                    </div>

                    <div className="booking-panel-detail-row">
                      <span className="booking-panel-detail-label">
                        Phone number
                      </span>
                      <span className="booking-panel-detail-value">
                        {candidate.phone ? candidate.phone : "No phone number added"}
                      </span>
                    </div>

                    <div className="booking-panel-detail-row">
                      <span className="booking-panel-detail-label">Procedure</span>
                      <span className="booking-panel-detail-value">
                        {candidate.procedure}
                      </span>
                    </div>

                    <div className="booking-panel-detail-row">
                      <span className="booking-panel-detail-label">
                        Current duration
                      </span>
                      <span className="booking-panel-detail-value">
                        {candidate.durationLabel}
                      </span>
                    </div>

                    <div className="booking-panel-detail-row">
                      <span className="booking-panel-detail-label">
                        Freed slot
                      </span>
                      <span className="booking-panel-detail-value">
                        {replacementSuggestionData.freedBooking.dateLabel},{" "}
                        {replacementSuggestionData.freedBooking.timeLabel}
                      </span>
                    </div>
                  </div>

                  <div className="booking-panel-actions">
                    <button
                      type="button"
                      className="booking-panel-button booking-panel-button-primary"
                      onClick={() => onMoveCandidateToFreedSlot(candidate.bookingKey)}
                    >
                      Move to freed slot
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {bookings.length === 0 ? (
        <div className="booking-panel-empty">
          No appointments have been booked for this day yet.
        </div>
      ) : (
        <div className="booking-panel-list">
          {bookings.map((booking) => {
            const endTime = `${String(Math.floor(booking.endMinutes / 60)).padStart(
              2,
              "0"
            )}:${String(booking.endMinutes % 60).padStart(2, "0")}`;
            const isExpanded = Boolean(expandedBookingKeys[booking.bookingKey]);
            const displayStartTime = formatTimeDisplay(booking.slot);
            const displayEndTime = formatTimeDisplay(endTime);
            const fullName = `${booking.name} ${booking.surname}`.trim();

            return (
              <article
                key={booking.bookingKey}
                className={`booking-panel-card ${
                  reschedulingBookingKey === booking.bookingKey
                    ? "booking-panel-card-active"
                    : ""
                }`}
              >
                <button
                  type="button"
                  className={`booking-panel-summary ${
                    isExpanded ? "booking-panel-summary-expanded" : ""
                  }`}
                  onClick={() => toggleBookingExpansion(booking.bookingKey)}
                  aria-expanded={isExpanded}
                >
                  <div className="booking-panel-time-range">
                    {displayStartTime} - {displayEndTime}
                  </div>
                  <div className="booking-panel-summary-name">
                    {fullName || "Unnamed patient"}
                  </div>
                  <div className="booking-panel-summary-procedure">
                    {booking.procedure}
                  </div>
                  <span className="booking-panel-summary-toggle">
                    {isExpanded ? "Hide details" : "Show details"}
                  </span>
                </button>

                <div
                  className={`booking-panel-details-wrapper ${
                    isExpanded ? "booking-panel-details-wrapper-expanded" : ""
                  }`}
                >
                  <div className="booking-panel-details">
                    <div className="booking-panel-detail-row">
                      <span className="booking-panel-detail-label">Name</span>
                      <span className="booking-panel-detail-value">
                        {booking.name}
                      </span>
                    </div>

                    <div className="booking-panel-detail-row">
                      <span className="booking-panel-detail-label">Surname</span>
                      <span className="booking-panel-detail-value">
                        {booking.surname}
                      </span>
                    </div>

                    <div className="booking-panel-detail-row">
                      <span className="booking-panel-detail-label">
                        Phone number
                      </span>
                      <span className="booking-panel-detail-value">
                        {booking.phone ? booking.phone : "No phone number added"}
                      </span>
                    </div>

                    <div className="booking-panel-detail-row">
                      <span className="booking-panel-detail-label">Procedure</span>
                      <span className="booking-panel-detail-value">
                        {booking.procedure}
                      </span>
                    </div>

                    <div className="booking-panel-detail-row">
                      <span className="booking-panel-detail-label">Reason</span>
                      <span className="booking-panel-detail-value">
                        {booking.reason}
                      </span>
                    </div>

                    <div className="booking-panel-detail-row">
                      <span className="booking-panel-detail-label">Gender</span>
                      <span className="booking-panel-detail-value">
                        {booking.gender}
                      </span>
                    </div>

                    <div className="booking-panel-detail-row">
                      <span className="booking-panel-detail-label">
                        Availability for anticipation
                      </span>
                      <span className="booking-panel-detail-value">
                        {booking.anticipation ? "Yes" : "No"}
                      </span>
                    </div>

                    <div className="booking-panel-detail-row">
                      <span className="booking-panel-detail-label">
                        Allergy to poorness
                      </span>
                      <span className="booking-panel-detail-value">
                        {booking.poornessAllergy ? "Yes" : "No"}
                      </span>
                    </div>

                    <div className="booking-panel-detail-row booking-panel-detail-row-notes">
                      <span className="booking-panel-detail-label">Notes</span>
                      <span className="booking-panel-detail-value">
                        {booking.notes ? booking.notes : "No notes added"}
                      </span>
                    </div>
                  </div>

                  <div className="booking-panel-actions">
                    <button
                      type="button"
                      className="booking-panel-button booking-panel-button-secondary"
                      onClick={() => onStartReschedule(booking.bookingKey)}
                    >
                      {reschedulingBookingKey === booking.bookingKey
                        ? "Rescheduling..."
                        : "Reschedule"}
                    </button>

                    <button
                      type="button"
                      className="booking-panel-button booking-panel-button-danger"
                      onClick={() => onCancelBooking(booking.bookingKey)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </aside>
  );
}

export default BookingList;
