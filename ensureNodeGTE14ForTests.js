if (Number.parseFloat(process.version.slice(1)) < 14) {
  throw new Error("The test suite requires node 14+");
}
