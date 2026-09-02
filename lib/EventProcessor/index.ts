// The public surface of the message half of the transport pipeline. Everything else in this
// directory is internal bookkeeping behind `createMessageExtractor`.
export { createMessageExtractor, type TMessageExtractor } from './messageExtractor';
