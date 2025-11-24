const SiteInfo = require('../models/SiteInfo');

exports.getSiteInfo = async (req, res, next) => {
  try {
    let info = await SiteInfo.findOne();

    if (!info) {
      info = await SiteInfo.create({});
    }

    res.status(200).json({ success: true, data: info });
  } catch (err) {
    next(err);
  }
};

exports.updateSiteInfo = async (req, res, next) => {
  try {
    const updates = {
      platformInfo: req.body.platformInfo ?? ''
    };

    const info = await SiteInfo.findOneAndUpdate({}, updates, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    });

    res.status(200).json({ success: true, data: info });
  } catch (err) {
    next(err);
  }
};
