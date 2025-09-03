module.exports = {
  Workbook: jest.fn().mockImplementation(() => ({
    addWorksheet: jest.fn().mockReturnValue({
      addTable: jest.fn(),
    }),
    xlsx: {
      writeFile: jest.fn().mockResolvedValue(),
    },
  })),
};
