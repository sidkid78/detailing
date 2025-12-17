
-- 0002_find_available_detailer_func.sql

-- Function to find an available detailer for a given time slot and service duration
CREATE OR REPLACE FUNCTION find_available_detailer(
    p_service_id UUID,
    p_desired_time TIMESTAMP WITH TIME ZONE,
    p_location_address TEXT -- Not directly used for availability but kept for potential future use (e.g., service area matching)
)
RETURNS TABLE (
    detailer_id UUID,
    business_name TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_estimated_duration_minutes INT;
    v_proposed_end_time TIMESTAMP WITH TIME ZONE;
    v_day_of_week INT; -- 0 for Sunday, 1 for Monday, ..., 6 for Saturday (PostgreSQL EXTRACT(DOW) convention)
BEGIN
    -- Get the estimated duration of the service
    SELECT estimated_duration_minutes
    INTO v_estimated_duration_minutes
    FROM public.services
    WHERE id = p_service_id;

    -- If service not found, raise an exception
    IF v_estimated_duration_minutes IS NULL THEN
        RAISE EXCEPTION 'Service with ID % not found.', p_service_id;
    END IF;

    -- Calculate the proposed end time for the booking
    v_proposed_end_time := p_desired_time + (v_estimated_duration_minutes * INTERVAL '1 minute');

    -- Get the day of the week from the desired booking time
    v_day_of_week := EXTRACT(DOW FROM p_desired_time);

    -- Return detailers who are active, available at the desired time, and do not have overlapping bookings
    RETURN QUERY
    SELECT
        d.id AS detailer_id,
        d.business_name
    FROM
        public.detailers d
    JOIN
        public.detailer_availability da ON d.id = da.detailer_id
    WHERE
        d.is_active = TRUE -- Ensure the detailer is active
        AND da.day_of_week = v_day_of_week -- Match the day of the week
        AND p_desired_time::TIME >= da.start_time -- Desired start time is within availability window
        AND v_proposed_end_time::TIME <= da.end_time -- Proposed end time is within availability window
        AND NOT EXISTS ( -- Check for overlapping bookings
            SELECT 1
            FROM public.bookings b
            WHERE
                b.detailer_id = d.id
                AND b.status IN ('pending', 'confirmed') -- Only consider active bookings for overlap
                AND (
                    -- Check if the new proposed slot (p_desired_time, v_proposed_end_time)
                    -- overlaps with any existing booking's slot (b.booking_time, b.booking_end_time)
                    -- We calculate b.booking_end_time on the fly using the service duration for that booking.
                    (b.booking_time, b.booking_time + (SELECT s.estimated_duration_minutes * INTERVAL '1 minute' FROM public.services s WHERE s.id = b.service_id))
                    OVERLAPS
                    (p_desired_time, v_proposed_end_time)
                )
        );
END;
$$;
