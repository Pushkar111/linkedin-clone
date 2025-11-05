/**
 * DEPRECATED: Firestore utilities - replaced with REST API
 * This file is kept for backward compatibility with legacy code
 * All functions now return stubs or empty values
 */

console.warn("firestoreUtil is deprecated. Please use REST API services instead.");

// Stub functions to prevent import errors
const where = () => {};
const orderBy = () => {};
const startAfter = () => {};

/**
 * Creates a document with a Custom Id (DEPRECATED - STUB)
 * @returns {Promise<boolean>}
 */
const createWithId = async () => {
  console.warn("firestoreUtil.createWithId is deprecated");
  return false;
};

/**
 * Creates a document with a Custom Id (DEPRECATED - STUB)
 * @returns
 */
const getDocumentCreator = () => {
  console.warn("firestoreUtil.getDocumentCreator is deprecated");
  return {
    strNewId: "",
    saveDoc: async () => false,
  };
};

/**
 * Creates a document with an auto-generated Id (DEPRECATED - STUB)
 * @returns {Promise<string>}
 */
const create = async () => {
  console.warn("firestoreUtil.create is deprecated");
  return "";
};

/**
 * Selects a document by Id (DEPRECATED - STUB)
 * @returns {Promise<object>}
 */
const selectById = async () => {
  console.warn("firestoreUtil.selectById is deprecated");
  return null;
};

/**
 * Selects all the documents in a Collection (DEPRECATED - STUB)
 * @returns {Promise<Array>}
 */
const selectAll = async () => {
  console.warn("firestoreUtil.selectAll is deprecated");
  return [];
};

/**
 * Get batch of documents (DEPRECATED - STUB)
 * @returns {Promise<Array>}
 */
const getBatch = async () => {
  console.warn("firestoreUtil.getBatch is deprecated");
  return [];
};

/**
 * Selects all the documents in a Collection Group (DEPRECATED - STUB)
 * @returns {Promise<Array>}
 */
const selectCollectionGroup = async () => {
  console.warn("firestoreUtil.selectCollectionGroup is deprecated");
  return [];
};

export {
  createWithId,
  create,
  selectById,
  selectAll,
  getBatch,
  where,
  getDocumentCreator,
  startAfter,
  orderBy,
  selectCollectionGroup,
};
