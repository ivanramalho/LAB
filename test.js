let concepts = ['old'];
function load() {
    concepts = ['new'];
}
function save() {
    console.log(concepts);
}
save();
load();
save();
