function (doc) {
    var key_parts = doc.key.split(".");
    emit([key_parts[0], doc.timestamp], doc);
}  
