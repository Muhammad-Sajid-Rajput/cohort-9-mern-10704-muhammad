import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import { HTTPSTATUS } from '../utils/enums';
import { UnauthorizedAccess } from '../utils/appError';
import {
  createFolder,
  renameFolder,
  deleteFolder,
  getFoldersOf,
  getFolderDetails,
  addNoteToFolder,
  removeNoteFromFolder,
  getAllFoldersFlat,
  getTrashFoldersOf,
  restoreFolderOf,
  permanentDeleteFolderOf,
} from '../services/folder.services';
import {
  createFolderSchema,
  renameFolderSchema,
  folderIdParamSchema,
  folderNoteParamSchema,
  addNoteToFolderSchema,
  getFoldersQuerySchema,
} from '../schemas/folder.zod';

export const createFolderHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  if (!userId) throw new UnauthorizedAccess('User not authenticated');
  const { name, parentFolderId } = createFolderSchema.parse(req.body);
  const result = await createFolder(userId, name, parentFolderId);
  return res.status(HTTPSTATUS.CREATED).json(result);
});

export const renameFolderHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  if (!userId) throw new UnauthorizedAccess('User not authenticated');
  const { folderId } = folderIdParamSchema.parse(req.params);
  const { name } = renameFolderSchema.parse(req.body);
  const result = await renameFolder(userId, folderId, name);
  return res.status(HTTPSTATUS.OK).json(result);
});

export const deleteFolderHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  if (!userId) throw new UnauthorizedAccess('User not authenticated');
  const { folderId } = folderIdParamSchema.parse(req.params);
  const result = await deleteFolder(userId, folderId);
  return res.status(HTTPSTATUS.OK).json(result);
});

export const getFoldersHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  if (!userId) throw new UnauthorizedAccess('User not authenticated');
  const { parentFolderId } = getFoldersQuerySchema.parse(req.query);
  const result = await getFoldersOf(userId, parentFolderId);
  return res.status(HTTPSTATUS.OK).json(result);
});

export const getAllFoldersFlatHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  if (!userId) throw new UnauthorizedAccess('User not authenticated');
  const result = await getAllFoldersFlat(userId);
  return res.status(HTTPSTATUS.OK).json(result);
});

export const getFolderDetailsHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  if (!userId) throw new UnauthorizedAccess('User not authenticated');
  const { folderId } = folderIdParamSchema.parse(req.params);
  const result = await getFolderDetails(userId, folderId);
  return res.status(HTTPSTATUS.OK).json(result);
});

export const addNoteToFolderHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  if (!userId) throw new UnauthorizedAccess('User not authenticated');
  const { folderId } = folderIdParamSchema.parse(req.params);
  const { noteId } = addNoteToFolderSchema.parse(req.body);
  const result = await addNoteToFolder(userId, folderId, noteId);
  return res.status(HTTPSTATUS.OK).json(result);
});

export const removeNoteFromFolderHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  if (!userId) throw new UnauthorizedAccess('User not authenticated');
  const { folderId, noteId } = folderNoteParamSchema.parse(req.params);
  const result = await removeNoteFromFolder(userId, folderId, noteId);
  return res.status(HTTPSTATUS.OK).json(result);
});


export const getTrashFoldersHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  if (!userId) throw new UnauthorizedAccess('User not authenticated');
  const result = await getTrashFoldersOf(userId);
  return res.status(HTTPSTATUS.OK).json(result);
});

export const restoreFolderHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  if (!userId) throw new UnauthorizedAccess('User not authenticated');
  const { folderId } = folderIdParamSchema.parse(req.params);
  const result = await restoreFolderOf(userId, folderId);
  return res.status(HTTPSTATUS.OK).json(result);
});

export const permanentDeleteFolderHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  if (!userId) throw new UnauthorizedAccess('User not authenticated');
  const { folderId } = folderIdParamSchema.parse(req.params);
  const result = await permanentDeleteFolderOf(userId, folderId);
  return res.status(HTTPSTATUS.OK).json(result);
});
