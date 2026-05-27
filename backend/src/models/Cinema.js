import mongoose from 'mongoose';

const cinemaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a cinema name'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Please provide a cinema location/address'],
      trim: true,
    },
    contact: {
      type: String,
      default: '',
    },
    imageUrl: {
      type: String,
      default: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80',
    },
  },
  {
    timestamps: true,
  }
);

const Cinema = mongoose.model('Cinema', cinemaSchema);
export default Cinema;
