<?php
  header("Content-Type: text/html");

  $post = $_REQUEST["data"];
  // data is in string format, json_decode converts to array
  // due to some reason, directly posting data as a JSON object truncates the array
  $contents = json_decode($post, true);
  
  $count = count($contents);

  // Timezone set, else use of date() throws warning in Mac
  date_default_timezone_set("Asia/Kolkata");
  $path = "./History (Dashboard)/all-prices." . date("Y.m.d");
  $current_count = count(glob($path . "*.json")) + 1;

  file_put_contents($path . "#" . $current_count . ".json" , json_encode(array_values($contents)));

  echo "Saved this run's price changes (" . $count . " scrips)!";

 ?>
