
module.exports = async function mapAccum(fn, acc, object) {
  var index = 0;
  var keys = Object.keys(object);
  var count = keys.length;
  var result = [];
  var tuple = [acc];
  while (index < count)
  {
    const key = keys[index];
    tuple = await fn(tuple[0], object[key], key);
    result[key] = tuple[1];
    ++index;
  }
  return [tuple[0], result];
}
