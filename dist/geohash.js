'use strict';

System.register([], function (_export, _context) {
  "use strict";

  function decodeGeoHash(geohash) {
    if (!geohash || geohash.length === 0) throw new Error('Missing geohash value');

    var BITS = [16, 8, 4, 2, 1];
    var BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';
    var isEven = 1;
    var lat = [];
    var lon = [];
    lat[0] = -90.0;
    lat[1] = 90.0;
    lon[0] = -180.0;
    lon[1] = 180.0;
    var base32Decoded = void 0;

    geohash.split('').forEach(function (item) {
      base32Decoded = BASE32.indexOf(item);
      BITS.forEach(function (mask) {
        if (isEven) {
          refineInterval(lon, base32Decoded, mask);
        } else {
          refineInterval(lat, base32Decoded, mask);
        }
        isEven = !isEven;
      });
    });
    var latCenter = (lat[0] + lat[1]) / 2;
    var lonCenter = (lon[0] + lon[1]) / 2;

    return { latitude: latCenter, longitude: lonCenter };
  }

  _export('default', decodeGeoHash);

  function refineInterval(interval, base32Decoded, mask) {
    /* eslint no-bitwise: 0 */
    if (base32Decoded & mask) {
      interval[0] = (interval[0] + interval[1]) / 2;
    } else {
      interval[1] = (interval[0] + interval[1]) / 2;
    }
  }
  return {
    setters: [],
    execute: function () {}
  };
});
//# sourceMappingURL=geohash.js.map
