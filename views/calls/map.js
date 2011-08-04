function (doc) {
    var key_parts = doc.key.split(".");
    emit([doc.timestamp, key_parts[1]], [doc.mean, doc.observations]);
}