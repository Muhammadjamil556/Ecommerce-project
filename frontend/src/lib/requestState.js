/** status: 'idle' | 'loading' | 'succeeded' | 'failed' */
export const initialRequest = { status: 'idle', error: null, requestId: null }

/** Handles loading, success and failure of one part of a slice's state. */
export function addRequestCases(builder, thunk, part, onSuccess) {
  // Only the newest request counts. After logout there is none.
  const isCurrent = (state, action) =>
    action.meta.requestId === state[part].requestId

  builder
    .addCase(thunk.pending, (state, action) => {
      state[part].status = 'loading'
      state[part].error = null
      state[part].requestId = action.meta.requestId
    })
    .addCase(thunk.fulfilled, (state, action) => {
      if (!isCurrent(state, action)) return
      state[part].status = 'succeeded'
      onSuccess(state[part], action.payload)
    })
    .addCase(thunk.rejected, (state, action) => {
      if (!isCurrent(state, action)) return
      state[part].status = 'failed'
      state[part].error = action.payload
    })
}
