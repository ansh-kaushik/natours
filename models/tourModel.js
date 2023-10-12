const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel');
// const validator1 = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: [true, 'Cannot create Duplicate Tours'],
      trim: true,
      maxlength: [
        40,
        'A Tour Name must have less than or equal to 40 characters',
      ],
      minlength: [
        10,
        'A Tour name must have more than or equal to 10 characters',
      ],
      // validate: [
      //   validator1.isAlpha,
      //   'A Tour name must only contain characters',
      // ],
    },

    slug: String,
    duration: {
      type: Number,
      required: [true, 'A Tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A Tour must have a Group size'],
    },
    difficulty: {
      type: String,
      required: [true, ' A Tour must have a difficultly'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficulty',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A Tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      //*** we can also use third party validators for complex types like credit card number etc */
      validate: {
        validator: function (val) {
          //****this keyword wokrs only for creating documents not updating documents***
          return val < this.price;
        },
        message: `Price Discount {VALUE} cannot be greate than Price`,
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A Tour must have a description'],
    },
    description: {
      type: String,
      trim: true.valueOf,
    },
    imageCover: {
      type: String,
      required: [true, 'A Tour must have a imageCover'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    startLocation: {
      type: {
        type: 'String',
        deafult: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          deafult: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
    secretTour: {
      type: Boolean,
      deafult: false,
    },
  },
  //ref to lecture 154 a 7:30 if you dont get toJSON and toObject
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
// 1 for ascending and -1 for descending order
// tourSchema.index({ price: 1 });  // single index
tourSchema.index({ price: 1, ratingsAverage: -1 }); // compound index
tourSchema.index({ slug: 1 });
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'user',
  localField: '_id',
});

// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });
// DOcument middleware runs before.save() or .create()
tourSchema.pre('save', function (next) {
  //this keyword in the function here denotes currently processed document
  this.slug = slugify(this.name, { lower: true });
  next();
});
// tourSchema.pre('save', function (next) {
//   console.log('Will save Document.. ');
//   next();
// });
// tourSchema.post('save', (doc, next) => {
//   console.log(doc);
//   next();
// });

// QUERY MIDDLEWARE:runs before and after .find()
tourSchema.pre(/^find/, function (next) {
  this.start = Date.now();
  this.find({ secretTour: { $ne: true } });

  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});
tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} ms`);
  next();
});

// AGGREGATION MIDDLEWARE: before and afte .aggregrate()
tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  console.log(this.pipeline());

  next();
});
// monooose automatically looks for plural lowercase name of model
// eg here mongoose.model('Tour') so mongoose look for a collection
// tours in your database
const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;
