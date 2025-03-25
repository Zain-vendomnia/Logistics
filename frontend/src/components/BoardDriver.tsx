import React, { useState, useEffect } from "react";
import { getDriverBoard } from "../services/user.service";
import EventBus from "../common/EventBus";

const BoardDriver: React.FC = () => {
  const [content, setContent] = useState<string>("");

  useEffect(() => {
    getDriverBoard().then(
      (response) => {
        setContent(response.data);
      },
      (error) => {
        const _content =
          (error.response &&
            error.response.data &&
            error.response.data.message) ||
          error.message ||
          error.toString();

        setContent(_content);

        if (error.response && error.response.status === 401) {
          EventBus.dispatch("logout");
        }
      }
    );
  }, []);

  return (
    <div className="container">
      <header className="jumbotron">
        <h3>Hi </h3>
      </header>
    </div>
  );
};

export default BoardDriver;
