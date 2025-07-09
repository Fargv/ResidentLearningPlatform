module.exports = jest.fn().mockImplementation(() => ({
  pipe: jest.fn(),
  fontSize: jest.fn().mockReturnThis(),
  text: jest.fn().mockReturnThis(),
  moveDown: jest.fn().mockReturnThis(),
  end: jest.fn()
}));
