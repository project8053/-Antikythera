<?php
  header("Content-Type: text/html");

  $symbol = "n.a.";
  $archive = $_POST["archive"];
  $root = json_decode($archive, true);
  foreach ($root as $current) {
    $symbol = $current["symbol"];
    $path = "./History/archive." . $current["date"] . ".json";
    $contents = array();
    if (file_exists($path)) {
      $contents = json_decode(file_get_contents($path), true);
      if (($key = array_search($symbol, array_column($contents, "symbol"))) !== false) {
        unset($contents[$key]);
      }
    }
    array_push($contents, array("symbol" => $symbol, "range" => $current["range"], "previousClosePrice" => $current["previousClosePrice"]));
    file_put_contents($path, json_encode(array_values($contents)));
  }
  echo "<script>console.log('Processing " . $symbol . " completed'); window.parent.postMessage({ 'response': 1 }, '*');</script>";

 ?>
