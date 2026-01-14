try {
  const rw = require('react-window');
  console.log('react-window exports:', Object.keys(rw));
} catch (e) {
  console.log('react-window error:', e.message);
}

try {
  const as = require('react-virtualized-auto-sizer');
  console.log('react-virtualized-auto-sizer exports keys:', Object.keys(as));
  console.log('react-virtualized-auto-sizer export type:', typeof as);
  if (typeof as === 'object') { // It might be a default export wrapper
      console.log('react-virtualized-auto-sizer default:', as.default);
  }
} catch (e) {
    console.log('auto-sizer error:', e.message);
}
