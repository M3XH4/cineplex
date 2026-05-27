const hasValue = (value) => value !== undefined && value !== null && !(typeof value === 'string' && value.trim() === '');

const createRequiredFieldsValidator = (fields, source = 'body') => (req, res, next) => {
  const input = source === 'params' ? req.params : req.body;
  const missingFields = fields.filter((field) => !hasValue(input[field]));

  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Missing required field(s): ${missingFields.join(', ')}`,
    });
  }

  next();
};

export const validateLogin = createRequiredFieldsValidator(['email', 'password']);
export const validateRegister = createRequiredFieldsValidator(['name', 'email', 'password']);
export const validateCreateBooking = createRequiredFieldsValidator(['showtimeId']);
export const validateCreateShowtime = createRequiredFieldsValidator(['movieId', 'roomId', 'startTime', 'basePrice']);
export const validateCreateCinema = createRequiredFieldsValidator(['name', 'location']);
export const validateCreateRoom = createRequiredFieldsValidator(['name', 'rowsCount', 'colsCount']);
export const validateCreateMovie = createRequiredFieldsValidator(['title', 'storyline', 'director', 'duration', 'releaseDate']);

export const validateBookingSeats = (req, res, next) => {
  const { seatLabels } = req.body;

  if (!Array.isArray(seatLabels) || seatLabels.length === 0 || seatLabels.some((seatLabel) => typeof seatLabel !== 'string' || !seatLabel.trim())) {
    return res.status(400).json({
      success: false,
      message: 'seatLabels must be a non-empty array of seat labels',
    });
  }

  next();
};

export const validateConfirmBooking = createRequiredFieldsValidator(['paymentMethod']);
