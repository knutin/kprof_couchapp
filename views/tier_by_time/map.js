function (doc) {
    var key_parts = doc.key.split(".");
    if (key_parts[1] == "_total") {
        emit([key_parts[0], doc.timestamp], doc);
    }
}
