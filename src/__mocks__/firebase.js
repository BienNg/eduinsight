// src/__mocks__/firebase.js
const firebaseMock = {
    database: {
      ref: jest.fn().mockReturnThis(),
      on: jest.fn(),
      once: jest.fn(),
      off: jest.fn(),
      push: jest.fn().mockReturnThis(),
      set: jest.fn().mockResolvedValue(),
      update: jest.fn().mockResolvedValue(),
      remove: jest.fn().mockResolvedValue(),
      get: jest.fn().mockResolvedValue({
        exists: jest.fn().mockReturnValue(true),
        val: jest.fn().mockReturnValue({})
      }),
      orderByChild: jest.fn().mockReturnThis(),
      equalTo: jest.fn().mockReturnThis(),
      query: jest.fn().mockReturnThis()
    }
  };
  
  const refMock = {
    on: jest.fn(),
    once: jest.fn(),
    off: jest.fn(),
    push: jest.fn().mockReturnThis(),
    set: jest.fn().mockResolvedValue(),
    update: jest.fn().mockResolvedValue(),
    remove: jest.fn().mockResolvedValue(),
    get: jest.fn().mockResolvedValue({
      exists: jest.fn().mockReturnValue(true),
      val: jest.fn().mockReturnValue({})
    })
  };
  
  // Mock the Firebase functions
  const ref = jest.fn().mockImplementation(() => refMock);
  const push = jest.fn().mockReturnThis();
  const set = jest.fn().mockResolvedValue();
  const update = jest.fn().mockResolvedValue();
  const remove = jest.fn().mockResolvedValue();
  const get = jest.fn().mockResolvedValue({
    exists: jest.fn().mockReturnValue(true),
    val: jest.fn().mockReturnValue({})
  });
  const query = jest.fn().mockReturnThis();
  const orderByChild = jest.fn().mockReturnThis();
  const equalTo = jest.fn().mockReturnThis();
  
  module.exports = {
    database: firebaseMock.database,
    ref,
    push,
    set,
    update,
    remove,
    get,
    query,
    orderByChild,
    equalTo
  };