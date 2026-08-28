import { Router } from 'express';
import {
  createFolderHandler,
  renameFolderHandler,
  deleteFolderHandler,
  getFoldersHandler,
  getAllFoldersFlatHandler,
  getFolderDetailsHandler,
  addNoteToFolderHandler,
  removeNoteFromFolderHandler,
  getTrashFoldersHandler,
  restoreFolderHandler,
  permanentDeleteFolderHandler,
} from '../controllers/folder.controller';
import { attachUserMiddleware } from '../middlewares/attachUserMiddleware';
import { validationJwtMiddleware } from '../middlewares/validator';

export const folderRoutes = Router();

folderRoutes.use(validationJwtMiddleware, attachUserMiddleware);

// Trash endpoints mounted before parameterized routes
folderRoutes.get('/trash', getTrashFoldersHandler);
folderRoutes.post('/trash/:folderId/restore', restoreFolderHandler);
folderRoutes.delete('/trash/:folderId', permanentDeleteFolderHandler);

// Flat and root endpoints
folderRoutes.get('/all', getAllFoldersFlatHandler);
folderRoutes.get('/', getFoldersHandler);
folderRoutes.post('/', createFolderHandler);

// Parameterized folder endpoints
folderRoutes.get('/:folderId', getFolderDetailsHandler);
folderRoutes.put('/:folderId', renameFolderHandler);
folderRoutes.delete('/:folderId', deleteFolderHandler);

// Note links
folderRoutes.post('/:folderId/notes', addNoteToFolderHandler);
folderRoutes.delete('/:folderId/notes/:noteId', removeNoteFromFolderHandler);
