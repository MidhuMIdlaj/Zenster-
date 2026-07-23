// src/redux/store.ts
import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage"; // defaults to localStorage
import { combineReducers } from "redux";
import {
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';

import adminAuthReducer from "./AdminAuthSlice";
import employeeAuthReducer from "./EmployeeAuthSlice";
import ComplaintSlice from "./ComplaintSlice";

// Configuration for redux-persist
const persistConfig = {
  key: "root",
  storage,
  whitelist: ['adminAuth', 'employeeAuth'], 
};

const rootReducer = combineReducers({
  adminAuth: adminAuthReducer,
  employeeAuth: employeeAuthReducer,
  Complaint: ComplaintSlice
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: import.meta.env.MODE !== 'production',
});

export const persistor = persistStore(store);

// TypeScript types for the store
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;