const mongoose = require('mongoose');

const siteInfoSchema = new mongoose.Schema({
  platformInfo: {
    type: String,
    default: ''
  },
}, {
  timestamps: true
});

module.exports = mongoose.model('SiteInfo', siteInfoSchema);
