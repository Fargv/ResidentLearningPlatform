module.exports = {
  generatePdf: jest.fn(() => Promise.resolve(Buffer.from('PDF')))
};
