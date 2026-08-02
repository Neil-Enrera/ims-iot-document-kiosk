const { describe, it } = require('node:test');
const assert = require('node:assert');

describe('API Response Utilities', () => {
  const mockRes = () => {
    const res = { statusCode: null, jsonData: null };
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (data) => { res.jsonData = data; return res; };
    return res;
  };

  const { successResponse, errorResponse, createdResponse, paginatedResponse } = require('../src/utils/apiResponse');

  describe('successResponse', () => {
    it('should return 200 with data', () => {
      const res = mockRes();
      successResponse(res, 'OK', { id: 1 });
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.jsonData.success, true);
      assert.strictEqual(res.jsonData.message, 'OK');
      assert.deepStrictEqual(res.jsonData.data, { id: 1 });
    });
  });

  describe('errorResponse', () => {
    it('should return error status with message', () => {
      const res = mockRes();
      errorResponse(res, 400, 'Bad request');
      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res.jsonData.success, false);
      assert.strictEqual(res.jsonData.message, 'Bad request');
    });

    it('should return 500 for server errors', () => {
      const res = mockRes();
      errorResponse(res, 500, 'Internal error');
      assert.strictEqual(res.statusCode, 500);
    });
  });

  describe('createdResponse', () => {
    it('should return 201 with data', () => {
      const res = mockRes();
      createdResponse(res, 'Created', { id: 1 });
      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(res.jsonData.success, true);
    });
  });

  describe('paginatedResponse', () => {
    it('should return paginated data', () => {
      const res = mockRes();
      const data = [{ id: 1 }, { id: 2 }];
      paginatedResponse(res, 'OK', data, 50, 1, 10);
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.jsonData.pagination.total, 50);
      assert.strictEqual(res.jsonData.pagination.page, 1);
      assert.strictEqual(res.jsonData.pagination.limit, 10);
      assert.strictEqual(res.jsonData.pagination.totalPages, 5);
      assert.strictEqual(res.jsonData.data.length, 2);
    });

    it('should calculate totalPages correctly', () => {
      const res = mockRes();
      paginatedResponse(res, 'OK', [], 25, 3, 10);
      assert.strictEqual(res.jsonData.pagination.totalPages, 3);
    });
  });
});
