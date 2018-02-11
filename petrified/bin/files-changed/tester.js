var i = 10;

(function do_it()
{
    console.log("BUIDLING");
    if (i--)
        setTimeout(do_it, 100);
    else
        console.log("DONE!");
})();

