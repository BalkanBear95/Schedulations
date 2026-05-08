import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import "./AppointmentRegistry.css";

const defaultFilters = {
  patientSearch: "",
  dateFrom: "",
  dateTo: "",
  procedure: "",
  status: "",
};

const appointmentRegistrySelectFields =
  "id, patient_name, patient_surname, phone, procedure_name, procedure_slots, appointment_date, start_time, end_time, status, notes";

function AppointmentRegistry() {
  const [filters, setFilters] = useState(defaultFilters);
  const [appointments, setAppointments] = useState([]);
  const [procedureOptions, setProcedureOptions] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "-";
    }

    const dateOnly = String(dateValue).split("T")[0];

    if (!dateOnly) {
      return "-";
    }

    const parsedDate = new Date(`${dateOnly}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) {
      return dateOnly;
    }

    return parsedDate.toLocaleDateString("en-GB");
  };

  const formatTimeValue = (timeValue) => {
    if (!timeValue) {
      return "-";
    }

    const [hours = "00", minutes = "00"] = String(timeValue).split(":");
    return `${hours}:${minutes}`;
  };

  const formatTimeRange = (startTime, endTime) => {
    if (!startTime && !endTime) {
      return "-";
    }

    return `${formatTimeValue(startTime)} - ${formatTimeValue(endTime)}`;
  };

  const formatTextValue = (value) => {
    if (value === null || value === undefined) {
      return "-";
    }

    const normalizedValue = String(value).trim();
    return normalizedValue ? normalizedValue : "-";
  };

  const formatPatientName = (name, surname) => {
    const fullName = [name, surname]
      .map((value) => String(value ?? "").trim())
      .filter(Boolean)
      .join(" ");

    return fullName || "-";
  };

  const formatDuration = (slotsValue) => {
    if (!slotsValue) {
      return "-";
    }

    return `${slotsValue} slot${Number(slotsValue) === 1 ? "" : "s"}`;
  };

  const loadFilterOptions = async () => {
    const { data, error } = await supabase
      .from("appointments")
      .select("procedure_name, status");

    if (error) {
      console.error(
        "Failed to load appointment registry filter options from Supabase.",
        error
      );
      return;
    }

    const nextProcedureOptions = [
      ...new Set(
        (data ?? [])
          .map((appointment) => appointment.procedure_name)
          .filter((procedureName) => String(procedureName ?? "").trim())
      ),
    ].sort((firstProcedure, secondProcedure) =>
      firstProcedure.localeCompare(secondProcedure)
    );

    const nextStatusOptions = [
      ...new Set(
        (data ?? [])
          .map((appointment) => appointment.status)
          .filter((statusValue) => String(statusValue ?? "").trim())
      ),
    ].sort((firstStatus, secondStatus) =>
      firstStatus.localeCompare(secondStatus)
    );

    setProcedureOptions(nextProcedureOptions);
    setStatusOptions(nextStatusOptions);
  };

  const loadAppointments = async (nextFilters = defaultFilters) => {
    setIsLoading(true);
    setErrorMessage("");

    const trimmedSearch = nextFilters.patientSearch.trim();
    const normalizedSearch = trimmedSearch.replaceAll(",", " ");
    let query = supabase
      .from("appointments")
      .select(appointmentRegistrySelectFields)
      .order("appointment_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (normalizedSearch) {
      query = query.or(
        `patient_name.ilike.%${normalizedSearch}%,patient_surname.ilike.%${normalizedSearch}%`
      );
    }

    if (nextFilters.dateFrom) {
      query = query.gte("appointment_date", nextFilters.dateFrom);
    }

    if (nextFilters.dateTo) {
      query = query.lte("appointment_date", nextFilters.dateTo);
    }

    if (nextFilters.procedure) {
      query = query.eq("procedure_name", nextFilters.procedure);
    }

    if (nextFilters.status) {
      query = query.eq("status", nextFilters.status);
    }

    const { data, error } = await query;

    if (error) {
      console.error(
        "Failed to load appointments for the appointment registry from Supabase.",
        error
      );
      setAppointments([]);
      setErrorMessage("Could not load appointments right now.");
      setIsLoading(false);
      return;
    }

    setAppointments(data ?? []);
    setIsLoading(false);
  };

  useEffect(() => {
    loadFilterOptions();
    loadAppointments(defaultFilters);
  }, []);

  const handleFilterChange = (fieldName, value) => {
    setFilters((previousFilters) => ({
      ...previousFilters,
      [fieldName]: value,
    }));
  };

  const handleSearch = (event) => {
    event.preventDefault();
    loadAppointments(filters);
  };

  const handleResetFilters = () => {
    setFilters(defaultFilters);
    loadAppointments(defaultFilters);
  };

  return (
    <section className="appointment-registry">
      <div className="appointment-registry-header">
        <div>
          <h2 className="appointment-registry-title">Appointment Registry</h2>
          <p className="appointment-registry-description">
            Read-only registry of appointments stored in Supabase.
          </p>
        </div>
        <div className="appointment-registry-count">
          {appointments.length} {appointments.length === 1 ? "result" : "results"}
        </div>
      </div>

      <form
        className="appointment-registry-filters"
        onSubmit={handleSearch}
      >
        <div className="appointment-registry-filter-grid">
          <label className="appointment-registry-field">
            <span className="appointment-registry-label">Patient search</span>
            <input
              type="text"
              value={filters.patientSearch}
              onChange={(event) =>
                handleFilterChange("patientSearch", event.target.value)
              }
              placeholder="Search by name or surname"
              className="appointment-registry-input"
            />
          </label>

          <label className="appointment-registry-field">
            <span className="appointment-registry-label">Date from</span>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(event) =>
                handleFilterChange("dateFrom", event.target.value)
              }
              className="appointment-registry-input"
            />
          </label>

          <label className="appointment-registry-field">
            <span className="appointment-registry-label">Date to</span>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(event) => handleFilterChange("dateTo", event.target.value)}
              className="appointment-registry-input"
            />
          </label>

          <label className="appointment-registry-field">
            <span className="appointment-registry-label">Procedure</span>
            <select
              value={filters.procedure}
              onChange={(event) =>
                handleFilterChange("procedure", event.target.value)
              }
              className="appointment-registry-input"
            >
              <option value="">All procedures</option>
              {procedureOptions.map((procedureName) => (
                <option key={procedureName} value={procedureName}>
                  {procedureName}
                </option>
              ))}
            </select>
          </label>

          <label className="appointment-registry-field">
            <span className="appointment-registry-label">Status</span>
            <select
              value={filters.status}
              onChange={(event) => handleFilterChange("status", event.target.value)}
              className="appointment-registry-input"
            >
              <option value="">All statuses</option>
              {statusOptions.map((statusValue) => (
                <option key={statusValue} value={statusValue}>
                  {statusValue}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="appointment-registry-actions">
          <button
            type="submit"
            className="appointment-registry-button appointment-registry-button-primary"
            disabled={isLoading}
          >
            {isLoading ? "Searching..." : "Search"}
          </button>
          <button
            type="button"
            className="appointment-registry-button appointment-registry-button-secondary"
            onClick={handleResetFilters}
            disabled={isLoading}
          >
            Reset filters
          </button>
        </div>
      </form>

      {errorMessage && (
        <div className="appointment-registry-status appointment-registry-status-error">
          {errorMessage}
        </div>
      )}

      {!errorMessage && isLoading && (
        <div className="appointment-registry-status">
          Loading appointments...
        </div>
      )}

      {!errorMessage && !isLoading && appointments.length === 0 && (
        <div className="appointment-registry-status">
          No appointments matched the current filters.
        </div>
      )}

      {!errorMessage && !isLoading && appointments.length > 0 && (
        <div className="appointment-registry-results">
          <div className="appointment-registry-table-wrapper appointment-registry-results-desktop">
            <table className="appointment-registry-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Patient name</th>
                  <th>Patient surname</th>
                  <th>Phone</th>
                  <th>Procedure</th>
                  <th>Duration/slots</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appointment) => (
                  <tr
                    key={
                      appointment.id ??
                      `${appointment.appointment_date}-${appointment.start_time}`
                    }
                  >
                    <td className="appointment-registry-table-date">
                      {formatDate(appointment.appointment_date)}
                    </td>
                    <td className="appointment-registry-table-time">
                      {formatTimeRange(
                        appointment.start_time,
                        appointment.end_time
                      )}
                    </td>
                    <td>{formatTextValue(appointment.patient_name)}</td>
                    <td>{formatTextValue(appointment.patient_surname)}</td>
                    <td>{formatTextValue(appointment.phone)}</td>
                    <td>{formatTextValue(appointment.procedure_name)}</td>
                    <td>{formatDuration(appointment.procedure_slots)}</td>
                    <td>{formatTextValue(appointment.status)}</td>
                    <td>{formatTextValue(appointment.notes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="appointment-registry-mobile-list appointment-registry-results-mobile">
            {appointments.map((appointment) => (
              <article
                key={
                  appointment.id ??
                  `${appointment.appointment_date}-${appointment.start_time}-mobile`
                }
                className="appointment-registry-card"
              >
                <div className="appointment-registry-card-header">
                  <div>
                    <p className="appointment-registry-card-patient">
                      {formatPatientName(
                        appointment.patient_name,
                        appointment.patient_surname
                      )}
                    </p>
                    <p className="appointment-registry-card-procedure">
                      {formatTextValue(appointment.procedure_name)}
                    </p>
                  </div>
                  <div className="appointment-registry-card-status">
                    {formatTextValue(appointment.status)}
                  </div>
                </div>

                <div className="appointment-registry-card-grid">
                  <div className="appointment-registry-card-field">
                    <span className="appointment-registry-card-label">Date</span>
                    <span className="appointment-registry-card-value">
                      {formatDate(appointment.appointment_date)}
                    </span>
                  </div>

                  <div className="appointment-registry-card-field">
                    <span className="appointment-registry-card-label">Time</span>
                    <span className="appointment-registry-card-value appointment-registry-card-value-nowrap">
                      {formatTimeRange(
                        appointment.start_time,
                        appointment.end_time
                      )}
                    </span>
                  </div>

                  <div className="appointment-registry-card-field">
                    <span className="appointment-registry-card-label">Phone</span>
                    <span className="appointment-registry-card-value">
                      {formatTextValue(appointment.phone)}
                    </span>
                  </div>

                  <div className="appointment-registry-card-field">
                    <span className="appointment-registry-card-label">
                      Duration/slots
                    </span>
                    <span className="appointment-registry-card-value">
                      {formatDuration(appointment.procedure_slots)}
                    </span>
                  </div>

                  <div className="appointment-registry-card-field appointment-registry-card-field-notes">
                    <span className="appointment-registry-card-label">Notes</span>
                    <span className="appointment-registry-card-value">
                      {formatTextValue(appointment.notes)}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default AppointmentRegistry;
