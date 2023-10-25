// review /  rating / createdAt / ref to tour/ ref to user
const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      require: [true, 'Review cannot be empty!'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      require: [true, 'Rating cannot be empty!'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      require: [true, 'Review must belong to a User.'],
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      require: [true, 'Review must belong to a Tour.'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: 'ratedFor',
  //   select: 'name _id',
  // }).populate({
  //   path: 'user',
  //   select: 'name photo _id',
  // });

  this.populate({
    path: 'ratedBy',
    select: 'name photo _id',
  });
  next();
});
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  // console.log(stats);
  await Tour.findByIdAndUpdate(tourId, {
    ratingsAverage: stats[0].avgRating,
    ratingsQuantity: stats[0].nRating,
  });
};
reviewSchema.pre(/^findOneAnd/, async function (next) {
  const r = await this.findOne();
  next();
});
reviewSchema.post('save', function () {
  // this points to current review
  this.constructor.calcAverageRatings(this.tour);
});
const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
