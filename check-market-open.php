<?php
  header("Content-Type: application/json");

  $link = curl_init();
  $url = sprintf("http://www.bseindia.com/markets/Equity/SensexData.aspx?radn=%0.14f", mt_rand() / mt_getrandmax());
  curl_setopt($link, CURLOPT_URL, $url);
  curl_setopt($link, CURLOPT_USERAGENT, "Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.13) Gecko/20080311 Firefox/2.0.0.13");
  curl_setopt($link, CURLOPT_HTTPHEADER, Array("Content-Type: application/x-www-form-urlencoded"));
  curl_setopt($link, CURLOPT_RETURNTRANSFER, true);
  $output = curl_exec($link);
  curl_close($link);

  $format = "{ \"state\": %s }";
  $nodes = explode("@", $output);
  if (isset($nodes[6])) {
    echo sprintf($format, $nodes[6]);
  }
  else {
    echo "{ \"error\": \"data is invalid\" }";
  }

 ?>
